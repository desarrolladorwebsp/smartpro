import { getPrismaClient } from "../db";
import { getServicePlanById } from "../services/repository";
import { buildOrderTotals, formatCurrency, parseMoney, sanitizeCartItem, TAX_RATE, type CartItemDraft } from "./service";

export type CheckoutCustomer = {
  name: string;
  email: string;
  phone: string;
  company?: string;
};

export type CheckoutPayload = {
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
  };
  items?: Array<Partial<CartItemDraft> & { unitPrice?: number | string }>;
  paymentStatus?: string;
  total?: number;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class CheckoutValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckoutValidationError";
  }
}

export function normalizeCustomer(input: CheckoutPayload["customer"]): CheckoutCustomer {
  const name = String(input?.name ?? "").trim();
  const email = String(input?.email ?? "").trim().toLowerCase();
  const phone = String(input?.phone ?? "").trim();
  const company = input?.company ? String(input.company).trim() : undefined;

  if (!name || !email || !phone) {
    throw new CheckoutValidationError("Faltan datos obligatorios del cliente.");
  }

  if (!emailPattern.test(email)) {
    throw new CheckoutValidationError("Correo electrónico inválido.");
  }

  if (phone.replace(/\D/g, "").length < 8) {
    throw new CheckoutValidationError("Teléfono inválido.");
  }

  return { name, email, phone, company };
}

function sanitizeItems(rawItems: CheckoutPayload["items"]): CartItemDraft[] {
  const items = Array.isArray(rawItems) ? rawItems : [];

  if (!items.length) {
    throw new CheckoutValidationError("La orden debe incluir al menos un producto.");
  }

  const normalized = items
    .map((item) => {
      const sanitized = sanitizeCartItem({
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unitPrice: typeof item.unitPrice === "string" ? parseMoney(item.unitPrice) : Number(item.unitPrice ?? 0),
        priceDisplay: item.priceDisplay,
        taxRate: item.taxRate,
        source: item.source,
      });

      if (!sanitized) {
        return null;
      }

      return {
        ...sanitized,
        quantity: Math.max(1, Number(sanitized.quantity) || 1),
        taxRate: sanitized.taxRate ?? TAX_RATE,
      };
    })
    .filter(Boolean) as CartItemDraft[];

  if (!normalized.length) {
    throw new CheckoutValidationError("Los productos no son válidos.");
  }

  return normalized;
}

async function applyCatalogPrices(items: CartItemDraft[]): Promise<CartItemDraft[]> {
  if (!getPrismaClient()) {
    return items;
  }

  try {
    return await Promise.all(
      items.map(async (item) => {
        const plan = await getServicePlanById(item.id);

        if (!plan) {
          return item;
        }

        return {
          ...item,
          name: plan.name,
          category: plan.categoryName || item.category,
          unitPrice: plan.price,
          taxRate: plan.taxRate ?? item.taxRate ?? TAX_RATE,
          priceDisplay: formatCurrency(plan.price),
        };
      }),
    );
  } catch (error) {
    console.error("[smartpro:checkout:catalog]", error);
    return items;
  }
}

export async function buildServerCheckoutOrder(payload: CheckoutPayload) {
  const customer = normalizeCustomer(payload.customer);
  const items = await applyCatalogPrices(sanitizeItems(payload.items));
  const totals = buildOrderTotals(items);

  return {
    customer,
    items,
    ...totals,
  };
}
