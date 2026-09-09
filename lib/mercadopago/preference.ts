import { Preference } from "mercadopago";

import { createMercadoPagoClient, getAppBaseUrl, getMercadoPagoAccessToken, isMercadoPagoTestCredentials } from "./config";
import { TAX_RATE, type CartItemDraft } from "../orders/service";
import type { CustomerOrder } from "../orders/repository";

function splitCustomerName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    name: parts[0] ?? fullName,
    surname: parts.slice(1).join(" ") || undefined,
  };
}

function toInclusiveUnitPrice(item: CartItemDraft) {
  return Math.round(item.unitPrice * (1 + (item.taxRate ?? TAX_RATE)));
}

export function buildPreferenceItems(order: Pick<CustomerOrder, "id" | "items" | "total">) {
  const expectedTotal = Math.round(order.total);
  const items = order.items.map((item) => ({
    id: item.id,
    title: item.name.slice(0, 256),
    quantity: item.quantity,
    currency_id: "CLP",
    category_id: "services",
    unit_price: toInclusiveUnitPrice(item),
  }));

  const currentTotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const delta = expectedTotal - currentTotal;

  if (delta !== 0 && items.length > 0) {
    const last = items[items.length - 1];
    last.unit_price = Math.max(1, last.unit_price + delta);
  }

  return items;
}

export function getCheckoutRedirectUrl(preference: { init_point?: string; sandbox_init_point?: string }) {
  const token = getMercadoPagoAccessToken();
  const checkoutUrl = isMercadoPagoTestCredentials(token)
    ? preference.sandbox_init_point || preference.init_point
    : preference.init_point;

  if (!checkoutUrl) {
    throw new Error("Mercado Pago no devolvió una URL de checkout.");
  }

  return checkoutUrl;
}

export async function createMercadoPagoPreference(order: CustomerOrder) {
  const appUrl = getAppBaseUrl();
  const returnUrl = `${appUrl}/api/mercadopago/return?orderId=${encodeURIComponent(order.id)}`;
  const payer = splitCustomerName(order.customer.name);

  const preference = new Preference(createMercadoPagoClient());
  const created = await preference.create({
    body: {
      items: buildPreferenceItems(order),
      payer: {
        name: payer.name,
        surname: payer.surname,
        email: order.customer.email,
        phone: {
          area_code: "56",
          number: order.customer.phone.replace(/\D/g, "").replace(/^56/, ""),
        },
      },
      external_reference: order.id,
      statement_descriptor: "SmartPro",
      notification_url: `${appUrl}/api/mercadopago/webhook`,
      back_urls: {
        success: returnUrl,
        pending: returnUrl,
        failure: returnUrl,
      },
      auto_return: "approved",
      metadata: {
        order_id: order.id,
      },
    },
  });

  if (!created.id) {
    throw new Error("Mercado Pago no devolvió un identificador de preferencia.");
  }

  return {
    id: created.id,
    checkoutUrl: getCheckoutRedirectUrl(created),
  };
}
