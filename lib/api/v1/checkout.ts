import { formatCurrency, TAX_RATE, type CartItemDraft } from "../../orders/service";
import { buildOrderTotals } from "../../orders/service";
import {
  PaymentGatewayError,
  startMercadoPagoCheckout,
  startWebpayCheckout,
  type PaymentCheckoutInput,
} from "../../orders/start-payment";
import { getScopedPlan } from "./catalog";
import { ApiError } from "./errors";
import { presentCheckoutSession, type ApiCheckoutSession } from "./presenters";
import { resolveReturnUrl } from "./return-url";
import type { ApiClientRecord } from "./types";

export const CHECKOUT_METHODS = ["webpay", "mercadopago"] as const;
export type CheckoutMethod = (typeof CHECKOUT_METHODS)[number];

export const MAX_CHECKOUT_ITEMS = 20;
export const MAX_ITEM_QUANTITY = 99;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CheckoutCustomerInput = {
  name: string;
  email: string;
  phone: string;
  company: string;
};

export type CheckoutItemInput = {
  planId: string;
  quantity: number;
};

export type ParsedCheckoutRequest = {
  method: CheckoutMethod;
  customer: CheckoutCustomerInput;
  items: CheckoutItemInput[];
  returnUrl: string;
  externalReference: string;
};

export function isCheckoutMethod(value: unknown): value is CheckoutMethod {
  return CHECKOUT_METHODS.includes(value as CheckoutMethod);
}

function readString(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return value == null ? "" : String(value).trim();
}

export function parseCheckoutCustomer(input: unknown): CheckoutCustomerInput {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ApiError("validation_failed", "Falta el objeto customer con name, email y phone.");
  }

  const source = input as Record<string, unknown>;
  const name = readString(source, "name");
  const email = readString(source, "email").toLowerCase();
  const phone = readString(source, "phone");
  const company = readString(source, "company");

  if (!name) {
    throw new ApiError("validation_failed", "customer.name es obligatorio.");
  }

  if (!EMAIL_PATTERN.test(email)) {
    throw new ApiError("validation_failed", "customer.email no es un correo válido.");
  }

  if (phone.replace(/\D/g, "").length < 8) {
    throw new ApiError("validation_failed", "customer.phone debe tener al menos 8 dígitos.");
  }

  return { name, email, phone, company };
}

export function parseCheckoutItems(input: unknown): CheckoutItemInput[] {
  if (!Array.isArray(input) || input.length === 0) {
    throw new ApiError("validation_failed", "items debe ser un arreglo con al menos un plan.");
  }

  if (input.length > MAX_CHECKOUT_ITEMS) {
    throw new ApiError("validation_failed", `items no puede superar ${MAX_CHECKOUT_ITEMS} elementos.`);
  }

  return input.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new ApiError("validation_failed", `items[${index}] debe ser un objeto con planId y quantity.`);
    }

    const source = entry as Record<string, unknown>;
    const planId = readString(source, "planId");

    if (!planId) {
      throw new ApiError("validation_failed", `items[${index}].planId es obligatorio.`);
    }

    const rawQuantity = source.quantity == null ? 1 : Number(source.quantity);

    if (!Number.isInteger(rawQuantity) || rawQuantity < 1 || rawQuantity > MAX_ITEM_QUANTITY) {
      throw new ApiError(
        "validation_failed",
        `items[${index}].quantity debe ser un entero entre 1 y ${MAX_ITEM_QUANTITY}.`,
      );
    }

    return { planId, quantity: rawQuantity };
  });
}

export function parseCheckoutRequest(body: Record<string, unknown>, client: ApiClientRecord): ParsedCheckoutRequest {
  const method = body.method;

  if (!isCheckoutMethod(method)) {
    throw new ApiError("validation_failed", 'method debe ser "webpay" o "mercadopago".');
  }

  const returnUrl = resolveReturnUrl({
    requested: body.returnUrl == null ? null : String(body.returnUrl),
    allowed: client.allowedReturnUrls,
  });

  if (!returnUrl) {
    throw new ApiError(
      "validation_failed",
      "returnUrl no está en la lista de URLs de retorno autorizadas para esta credencial.",
      { allowedReturnUrls: client.allowedReturnUrls },
    );
  }

  const externalReference = readString(body, "externalReference").slice(0, 191);

  return {
    method,
    customer: parseCheckoutCustomer(body.customer),
    items: parseCheckoutItems(body.items),
    returnUrl,
    externalReference,
  };
}

/// Los precios se toman siempre del catálogo, nunca del cuerpo de la
/// solicitud: el sitio satélite elige qué planes cobrar, no cuánto cobrar.
export async function resolveCheckoutItems(
  client: ApiClientRecord,
  items: CheckoutItemInput[],
): Promise<CartItemDraft[]> {
  return Promise.all(
    items.map(async (item) => {
      const plan = await getScopedPlan(client, item.planId);

      if (plan.price <= 0) {
        throw new ApiError(
          "validation_failed",
          `El plan "${plan.name}" no tiene precio publicado y debe cotizarse; no se puede cobrar en línea.`,
          { planId: plan.id },
        );
      }

      return {
        id: plan.id,
        name: plan.name,
        category: plan.categoryName,
        quantity: item.quantity,
        unitPrice: plan.price,
        priceDisplay: formatCurrency(plan.price),
        taxRate: plan.taxRate ?? TAX_RATE,
        source: `api:${client.slug}`,
      } satisfies CartItemDraft;
    }),
  );
}

export type CheckoutRedirect =
  | { type: "url"; method: "GET"; url: string }
  | { type: "form_post"; method: "POST"; url: string; fields: Record<string, string> };

export type CheckoutSessionResult = {
  session: ApiCheckoutSession;
  redirect: CheckoutRedirect;
};

export async function createCheckoutSession(
  client: ApiClientRecord,
  body: Record<string, unknown>,
): Promise<CheckoutSessionResult> {
  const parsed = parseCheckoutRequest(body, client);
  const items = await resolveCheckoutItems(client, parsed.items);
  const totals = buildOrderTotals(items);

  const checkout: PaymentCheckoutInput = {
    customer: {
      name: parsed.customer.name,
      email: parsed.customer.email,
      phone: parsed.customer.phone,
      company: parsed.customer.company || undefined,
    },
    items,
    ...totals,
    apiClientId: client.id,
    apiReturnUrl: parsed.returnUrl,
    apiExternalReference: parsed.externalReference,
  };

  try {
    if (parsed.method === "webpay") {
      const result = await startWebpayCheckout(checkout);

      return {
        session: presentCheckoutSession(result.order, {
          returnUrl: parsed.returnUrl,
          externalReference: parsed.externalReference,
        }),
        redirect: {
          type: "form_post",
          method: "POST",
          url: result.webpay.url,
          fields: { token_ws: result.webpay.token },
        },
      };
    }

    const result = await startMercadoPagoCheckout(checkout);

    return {
      session: presentCheckoutSession(result.order, {
        returnUrl: parsed.returnUrl,
        externalReference: parsed.externalReference,
      }),
      redirect: {
        type: "url",
        method: "GET",
        url: result.mercadopago.checkoutUrl,
      },
    };
  } catch (error) {
    if (error instanceof PaymentGatewayError) {
      throw new ApiError("payment_gateway_error", error.message);
    }

    throw error;
  }
}
