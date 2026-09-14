import { sendOrderNotification } from "../orders/email";
import {
  findOrderByWebpayToken,
  getOrderRecord,
  updateOrderRecord,
  type CustomerOrder,
} from "../orders/repository";
import { tryRegisterSaleFromPaidOrder } from "../sales/register-paid-order";
import { amountsMatch, isWebpayApproved, type WebpayCommitSnapshot } from "./status";

export type ApplyWebpayResult = {
  order: CustomerOrder | null;
  duplicate: boolean;
  emailSent: boolean;
};

function paymentKey(token: string, outcome: string) {
  return `webpay:${token}:${outcome}`;
}

async function sendApprovedOrderEmail(
  order: CustomerOrder,
  sendEmail: typeof sendOrderNotification,
) {
  try {
    const result = await sendEmail({
      id: order.id,
      createdAt: order.createdAt,
      customer: order.customer,
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      paymentMethod: "transbank",
      paymentStatus: "paid",
    });

    if (!result.delivered) {
      return { order, delivered: false };
    }

    const updated = await updateOrderRecord(order.id, {
      notificationEmailSentAt: new Date().toISOString(),
    });

    return { order: updated ?? order, delivered: true };
  } catch (error) {
    console.error("[smartpro:webpay:email]", error);
    return { order, delivered: false };
  }
}

async function resolveOrder(input: { buyOrder?: string; token?: string }): Promise<CustomerOrder | null> {
  if (input.buyOrder) {
    const byId = await getOrderRecord(input.buyOrder);
    if (byId) return byId;
  }

  if (input.token) {
    return findOrderByWebpayToken(input.token);
  }

  return null;
}

export async function applyWebpayCommit(
  snapshot: WebpayCommitSnapshot,
  sendEmail: typeof sendOrderNotification = sendOrderNotification,
): Promise<ApplyWebpayResult> {
  const approved = isWebpayApproved(snapshot);
  const outcome = approved ? "authorized" : "rejected";
  const key = paymentKey(snapshot.token, outcome);
  const order = await resolveOrder({ buyOrder: snapshot.buy_order, token: snapshot.token });

  if (!order) {
    throw new Error("No se encontró la orden asociada al pago Webpay.");
  }

  if (order.processedPaymentKeys?.includes(key)) {
    if (order.paymentStatus === "paid") {
      await tryRegisterSaleFromPaidOrder(order);
      if (!order.notificationEmailSentAt) {
        const emailSent = await sendApprovedOrderEmail(order, sendEmail);
        return { order: emailSent.order, duplicate: true, emailSent: emailSent.delivered };
      }
    }
    return { order, duplicate: true, emailSent: false };
  }

  if (order.paymentStatus === "paid") {
    await tryRegisterSaleFromPaidOrder(order);
    return {
      order: await updateOrderRecord(order.id, {
        processedPaymentKeys: [...(order.processedPaymentKeys ?? []), key],
        webpayToken: snapshot.token,
        paymentMethod: "transbank",
      }),
      duplicate: true,
      emailSent: false,
    };
  }

  if (approved) {
    if (snapshot.buy_order && snapshot.buy_order !== order.id) {
      throw new Error("La orden de Webpay no coincide con la orden interna.");
    }

    if (!amountsMatch(order.total, snapshot.amount)) {
      console.error("[smartpro:webpay:sync] Monto de pago no coincide con la orden", {
        orderId: order.id,
        token: snapshot.token,
      });
      throw new Error("El monto del pago no coincide con la orden.");
    }
  }

  const nextOrder = await updateOrderRecord(order.id, {
    paymentStatus: approved ? "paid" : "failed",
    orderStatus: approved ? "confirmed" : "cancelled",
    status: approved ? "confirmed" : "cancelled",
    paymentMethod: "transbank",
    webpayToken: snapshot.token,
    processedPaymentKeys: [...(order.processedPaymentKeys ?? []), key],
  });

  if (!nextOrder) {
    throw new Error("No se pudo actualizar la orden.");
  }

  if (approved) {
    await tryRegisterSaleFromPaidOrder(nextOrder);
  }

  if (approved && !nextOrder.notificationEmailSentAt) {
    const emailSent = await sendApprovedOrderEmail(nextOrder, sendEmail);
    return { order: emailSent.order, duplicate: false, emailSent: emailSent.delivered };
  }

  return { order: nextOrder, duplicate: false, emailSent: false };
}

export async function applyWebpayInterrupted(input: {
  kind: "aborted" | "timeout" | "error";
  token?: string;
  buyOrder?: string;
}): Promise<ApplyWebpayResult> {
  const order = await resolveOrder({ buyOrder: input.buyOrder, token: input.token });
  if (!order) {
    return { order: null, duplicate: false, emailSent: false };
  }

  if (order.paymentStatus === "paid") {
    return { order, duplicate: true, emailSent: false };
  }

  const key = paymentKey(input.token || order.webpayToken || order.id, input.kind);
  if (order.processedPaymentKeys?.includes(key)) {
    return { order, duplicate: true, emailSent: false };
  }

  const nextOrder = await updateOrderRecord(order.id, {
    paymentStatus: input.kind === "error" ? "failed" : "cancelled",
    orderStatus: "cancelled",
    status: "cancelled",
    paymentMethod: "transbank",
    processedPaymentKeys: [...(order.processedPaymentKeys ?? []), key],
  });

  return { order: nextOrder, duplicate: false, emailSent: false };
}
