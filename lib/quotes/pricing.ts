import { formatCurrency, parseMoney } from "../orders/service";

export const QUOTE_DISCOUNT_TYPES = ["NONE", "PERCENT", "AMOUNT"] as const;

export type QuoteDiscountType = (typeof QUOTE_DISCOUNT_TYPES)[number];

export type QuoteDiscountInput = {
  type: QuoteDiscountType;
  value: number;
};

export type QuoteMoneyTotals = {
  subtotal: number;
  tax: number;
  total: number;
};

export type QuotePricedTotals = QuoteMoneyTotals & {
  discountType: QuoteDiscountType;
  discountValue: number;
  discountAmount: number;
};

const MAX_PERCENT = 100;
const MAX_AMOUNT = 100_000_000;

export function isQuoteDiscountType(value: unknown): value is QuoteDiscountType {
  return QUOTE_DISCOUNT_TYPES.includes(value as QuoteDiscountType);
}

export function parseQuoteDiscount(input: { type?: unknown; value?: unknown } = {}): QuoteDiscountInput {
  const rawType = String(input.type ?? "NONE")
    .trim()
    .toUpperCase();

  if (!rawType || rawType === "NONE") {
    return { type: "NONE", value: 0 };
  }

  if (rawType === "PERCENT") {
    const parsed = Number(String(input.value ?? "").replace(",", "."));
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > MAX_PERCENT) {
      throw new Error("El descuento en porcentaje debe estar entre 0 y 100.");
    }
    const value = Math.round(parsed * 100) / 100;
    return value > 0 ? { type: "PERCENT", value } : { type: "NONE", value: 0 };
  }

  if (rawType === "AMOUNT") {
    const value = Math.round(parseMoney(input.value as string | number | null | undefined));
    if (!Number.isFinite(value) || value < 0) {
      throw new Error("El descuento en pesos no es válido.");
    }
    if (value > MAX_AMOUNT) {
      throw new Error("El descuento en pesos es demasiado alto.");
    }
    return value > 0 ? { type: "AMOUNT", value } : { type: "NONE", value: 0 };
  }

  throw new Error("Tipo de descuento inválido.");
}

export function applyQuoteDiscount(gross: QuoteMoneyTotals, discount: QuoteDiscountInput): QuotePricedTotals {
  const parsed = parseQuoteDiscount(discount);

  if (parsed.type === "NONE") {
    return {
      subtotal: gross.subtotal,
      tax: gross.tax,
      total: gross.total,
      discountType: "NONE",
      discountValue: 0,
      discountAmount: 0,
    };
  }

  const discountAmount =
    parsed.type === "PERCENT"
      ? Math.round((Number(gross.subtotal) * parsed.value) / 100)
      : Math.round(parsed.value);

  if (discountAmount > Number(gross.subtotal)) {
    throw new Error("El descuento no puede ser mayor al subtotal.");
  }

  const subtotal = Number(gross.subtotal) - discountAmount;
  const tax = Number(gross.subtotal) > 0 ? Number(gross.tax) * (subtotal / Number(gross.subtotal)) : 0;

  return {
    subtotal,
    tax,
    total: subtotal + tax,
    discountType: parsed.type,
    discountValue: parsed.value,
    discountAmount,
  };
}

export function quoteItemsGross(items: Array<{ subtotal: number; tax: number; total: number }>): QuoteMoneyTotals {
  return {
    subtotal: items.reduce((sum, item) => sum + item.subtotal, 0),
    tax: items.reduce((sum, item) => sum + item.tax, 0),
    total: items.reduce((sum, item) => sum + item.total, 0),
  };
}

export function formatQuoteDiscountLabel(discount: Pick<QuotePricedTotals, "discountType" | "discountValue" | "discountAmount">): string | null {
  if (discount.discountType === "NONE" || discount.discountAmount <= 0) {
    return null;
  }

  if (discount.discountType === "PERCENT") {
    const percent = Number.isInteger(discount.discountValue)
      ? String(discount.discountValue)
      : String(discount.discountValue);
    return `Descuento (${percent}%)`;
  }

  return "Descuento";
}

export function formatQuoteDiscountValue(discount: Pick<QuotePricedTotals, "discountAmount">): string {
  return `-${formatCurrency(discount.discountAmount)}`;
}
