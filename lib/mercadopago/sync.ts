import { Payment } from "mercadopago";

import { createMercadoPagoClient } from "./config";
import { canTransitionPaymentStatus, mapMercadoPagoStatus } from "./status";
import { sendOrderNotification } from "../orders/email";
import {
  findOrderByMercadoPagoPaymentId,
  getOrderRecord,
  updateOrderRecord,
  type CustomerOrder,
} from "../orders/repository";

export type MercadoPagoPaymentSnapshot = {
  id: string | number;
  status?: string;
  external_reference?: string;
  transaction_amount?: number;
};

export type ApplyPaymentResult = {
  order: CustomerOrder | null;
  duplicate: boolean;
  emailSent: boolean;
};

function paymentKey(paymentId: string, status: string) {
  return `${paymentId}:${status}`;
}

function amountsMatch(orderTotal: number, transactionAmount: number | undefined) {
  if (typeof transactionAmount !== "number" || !Number.isFinite(transactionAmount)) {
    return false;
  }

  return Math.round(orderTotal) === Math.round(transactionAmount);
}

export async function getMercadoPagoPayment(paymentId: string | number): Promise<MercadoPagoPaymentSnapshot> {
  const payment = new Payment(createMercadoPagoClient());
  const result = await payment.get({ id: paymentId });

  if (result.id == null) {
    throw new Error("Mercado Pago no devolvió el pago consultado.");
  }

  return {
    id: result.id,
    status: result.status,
    external_reference: result.external_reference,
    transaction_amount: result.transaction_amount,
  };
}

export async function applyMercadoPagoPayment(
  snapshot: MercadoPagoPaymentSnapshot,
  sendEmail: typeof sendOrderNotification = sendOrderNotification,
): Promise<ApplyPaymentResult> {
  const paymentId = String(snapshot.id);
  const mpStatus = String(snapshot.status ?? "").trim().toLowerCase();
  const mapped = mapMercadoPagoStatus(mpStatus);
  const key = paymentKey(paymentId, mpStatus);

  const order =
    (snapshot.external_reference ? await getOrderRecord(snapshot.external_reference) : null) ??
    (await findOrderByMercadoPagoPaymentId(paymentId));

  if (!order) {
    console.error("[smartpro:mercadopago:sync] Orden no encontrada", {
      paymentId,
      externalReference: snapshot.external_reference ?? null,
    });
    throw new Error("No se encontró la orden asociada al pago.");
  }

  const alreadyProcessed = order.processedPaymentKeys?.includes(key);

  if (alreadyProcessed) {
    if (order.paymentStatus === "paid" && !order.notificationEmailSentAt) {
      const emailSent = await sendApprovedOrderEmail(order, sendEmail);
      return { order: emailSent.order, duplicate: true, emailSent: emailSent.delivered };
    }

    return { order, duplicate: true, emailSent: false };
  }

  if (mapped.paymentStatus === "paid" && !amountsMatch(order.total, snapshot.transaction_amount)) {
    console.error("[smartpro:mercadopago:sync] Monto de pago no coincide con la orden", {
      orderId: order.id,
      paymentId,
    });
    throw new Error("El monto del pago no coincide con la orden.");
  }

  if (!canTransitionPaymentStatus(order.paymentStatus, mapped.paymentStatus)) {
    return {
      order: await updateOrderRecord(order.id, {
        processedPaymentKeys: [...(order.processedPaymentKeys ?? []), key],
        mercadopagoPaymentId: paymentId,
        paymentMethod: "mercadopago",
      }),
      duplicate: true,
      emailSent: false,
    };
  }

  const nextOrder = await updateOrderRecord(order.id, {
    paymentStatus: mapped.paymentStatus,
    orderStatus: mapped.orderStatus,
    status: mapped.orderStatus,
    paymentMethod: "mercadopago",
    mercadopagoPaymentId: paymentId,
    processedPaymentKeys: [...(order.processedPaymentKeys ?? []), key],
  });

  if (!nextOrder) {
    throw new Error("No se pudo actualizar la orden.");
  }

  if (mapped.paymentStatus === "paid" && !nextOrder.notificationEmailSentAt) {
    const emailSent = await sendApprovedOrderEmail(nextOrder, sendEmail);
    return { order: emailSent.order, duplicate: false, emailSent: emailSent.delivered };
  }

  return { order: nextOrder, duplicate: false, emailSent: false };
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
      paymentMethod: "mercadopago",
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
    console.error("[smartpro:mercadopago:email]", error);
    return { order, delivered: false };
  }
}
