export const TAX_RATE = 0.19 as const;

export type CartItemDraft = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  priceDisplay?: string;
  taxRate?: number;
  source?: string;
};

export type OrderItem = CartItemDraft & {
  subtotal: number;
  tax: number;
  total: number;
};

export type Totals = {
  subtotal: number;
  tax: number;
  total: number;
};

export function parseMoney(value: string | number | null | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const normalized = String(value ?? "")
    .replace(/[\s$]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function sanitizeCartItem(item: Partial<CartItemDraft>): CartItemDraft | null {
  if (!item || !item.id || !item.name || !item.category) {
    return null;
  }

  const quantity = Math.max(1, Number(item.quantity) || 1);
  const unitPrice = Math.max(0, Number(item.unitPrice) || parseMoney(item.priceDisplay ?? "0"));

  return {
    id: String(item.id),
    name: String(item.name),
    category: String(item.category),
    quantity,
    unitPrice,
    priceDisplay: item.priceDisplay ?? formatCurrency(unitPrice),
    taxRate: item.taxRate ?? TAX_RATE,
    source: item.source,
  };
}

export function buildOrderTotals(items: CartItemDraft[]): Totals {
  const subtotal = items.reduce((sum, item) => {
    const quantity = Math.max(1, Number(item.quantity) || 1);
    return sum + (Number(item.unitPrice) || 0) * quantity;
  }, 0);

  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  return {
    subtotal,
    tax,
    total,
  };
}

export function buildOrderItems(items: CartItemDraft[]): OrderItem[] {
  return items.map((item) => {
    const safeItem = sanitizeCartItem(item);

    if (!safeItem) {
      return null;
    }

    const subtotal = safeItem.unitPrice * safeItem.quantity;
    const tax = subtotal * (safeItem.taxRate ?? TAX_RATE);
    const total = subtotal + tax;

    return {
      ...safeItem,
      subtotal,
      tax,
      total,
    };
  }).filter(Boolean) as OrderItem[];
}

export function generateOrderId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const sequence = Math.floor(Math.random() * 900000) + 100000;
  return `SP-${year}-${sequence}`;
}
