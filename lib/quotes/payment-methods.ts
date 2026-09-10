export type QuotePaymentMethod = {
  id: string;
  title: string;
  description?: string;
};

export const QUOTE_PAYMENT_METHODS: QuotePaymentMethod[] = [
  { id: "cash", title: "Efectivo" },
  { id: "transfer", title: "Transferencia bancaria" },
  { id: "credit", title: "Tarjeta de crédito" },
  { id: "debit", title: "Tarjeta de débito" },
];

export function getQuotePaymentMethods(): QuotePaymentMethod[] {
  return QUOTE_PAYMENT_METHODS.map((method) => ({ ...method }));
}

export function formatQuotePaymentMethodsText(): string {
  return getQuotePaymentMethods()
    .map((method) => method.title)
    .join("\n");
}
