import { CheckoutValidationError, normalizeCustomer } from "../orders/checkout";
import { buildOrderTotals, formatCurrency, type CartItemDraft } from "../orders/service";
import { canPayQuote, isQuoteExpired } from "./status";
import type { QuoteRecord } from "./types";

export type QuoteCheckoutOrder = {
  customer: ReturnType<typeof normalizeCustomer>;
  items: CartItemDraft[];
  subtotal: number;
  tax: number;
  total: number;
};

export function getQuotePaymentBlockReason(quote: QuoteRecord, alreadySold = false): string | null {
  if (quote.status === "REJECTED") {
    return "Esta cotización ya no está disponible para pago.";
  }

  if (quote.status === "DRAFT") {
    return "Esta cotización aún no está disponible para pago en línea.";
  }

  if (!canPayQuote(quote.status)) {
    return "Esta cotización ya no está disponible para pago.";
  }

  if (isQuoteExpired(quote.validUntil)) {
    return "Esta cotización venció y ya no se puede pagar en línea.";
  }

  if (alreadySold) {
    return "Esta cotización ya fue registrada como venta.";
  }

  if (!quote.items.length || Math.round(quote.total) < 1) {
    return "Esta cotización no tiene un monto pagable.";
  }

  return null;
}

export function buildQuoteCheckoutOrder(quote: QuoteRecord): QuoteCheckoutOrder {
  const customer = normalizeCustomer({
    name: quote.clientName || quote.clientCompany,
    email: quote.clientEmail,
    phone: quote.clientPhone,
    company: quote.clientCompany,
  });

  const items = quote.items.map((item) => ({
    id: item.planId || item.id,
    name: item.planName,
    category: item.categoryName || "Servicios",
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    priceDisplay: formatCurrency(item.unitPrice),
    taxRate: item.taxRate,
    source: "quote",
  }));

  if (!items.length) {
    throw new CheckoutValidationError("La cotización no incluye servicios pagables.");
  }

  const totals = buildOrderTotals(items);

  if (Math.round(totals.total) !== Math.round(quote.total)) {
    throw new CheckoutValidationError("Los montos de la cotización no coinciden con los registrados.");
  }

  return {
    customer,
    items,
    subtotal: quote.subtotal,
    tax: quote.tax,
    total: quote.total,
  };
}
