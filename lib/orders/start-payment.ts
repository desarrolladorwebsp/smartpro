import { createMercadoPagoPreference } from "../mercadopago/preference";
import { getWebpayReturnUrl, getWebpayTransaction, isAllowedWebpayRedirectUrl, toWebpayAmount } from "../webpay";
import type { CheckoutCustomer } from "./checkout";
import { createOrderRecord, updateOrderRecord, type CustomerOrder } from "./repository";
import { generateOrderId, type CartItemDraft } from "./service";

export class PaymentGatewayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentGatewayError";
  }
}

export type PaymentCheckoutInput = {
  customer: CheckoutCustomer;
  items: CartItemDraft[];
  subtotal: number;
  tax: number;
  total: number;
};

export type WebpayCheckoutResult = {
  order: CustomerOrder;
  webpay: {
    token: string;
    url: string;
  };
};

export type MercadoPagoCheckoutResult = {
  order: CustomerOrder;
  mercadopago: {
    preferenceId: string;
    checkoutUrl: string;
  };
};

function toOrderDraft(checkout: PaymentCheckoutInput, paymentMethod: CustomerOrder["paymentMethod"]) {
  return {
    id: generateOrderId(),
    customer: checkout.customer,
    items: checkout.items,
    subtotal: checkout.subtotal,
    tax: checkout.tax,
    total: checkout.total,
    paymentStatus: "pending" as const,
    orderStatus: "pending" as const,
    status: "pending" as const,
    paymentMethod,
  };
}

export async function startWebpayCheckout(checkout: PaymentCheckoutInput): Promise<WebpayCheckoutResult> {
  const draft = toOrderDraft(checkout, "transbank");
  const order = await createOrderRecord(draft);
  const amount = toWebpayAmount(order.total);
  const sessionId = `${order.id}-session`;

  try {
    const webpay = getWebpayTransaction();
    const response = await webpay.create(order.id, sessionId, amount, getWebpayReturnUrl());

    if (!response?.token || !response?.url || !isAllowedWebpayRedirectUrl(response.url)) {
      throw new PaymentGatewayError("Webpay no devolvió una URL de redirección válida.");
    }

    const updated = await updateOrderRecord(order.id, { webpayToken: response.token });

    return {
      order: updated ?? order,
      webpay: {
        token: response.token,
        url: response.url,
      },
    };
  } catch (error) {
    await updateOrderRecord(order.id, {
      paymentStatus: "failed",
      orderStatus: "cancelled",
      status: "cancelled",
    });
    throw error instanceof PaymentGatewayError
      ? error
      : new PaymentGatewayError("No se pudo iniciar el pago con Webpay.");
  }
}

export async function startMercadoPagoCheckout(checkout: PaymentCheckoutInput): Promise<MercadoPagoCheckoutResult> {
  const draft = toOrderDraft(checkout, "mercadopago");
  const order = await createOrderRecord(draft);

  try {
    const preference = await createMercadoPagoPreference(order);
    const updated = await updateOrderRecord(order.id, { preferenceId: preference.id });

    return {
      order: updated ?? order,
      mercadopago: {
        preferenceId: preference.id,
        checkoutUrl: preference.checkoutUrl,
      },
    };
  } catch (error) {
    await updateOrderRecord(order.id, {
      paymentStatus: "failed",
      orderStatus: "cancelled",
      status: "cancelled",
    });
    throw error instanceof PaymentGatewayError
      ? error
      : new PaymentGatewayError("No se pudo iniciar el pago con Mercado Pago.");
  }
}
