export function parseDeliveryBusinessDays(value: unknown): number {
  const parsed = Math.trunc(Number(value));

  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 365) {
    throw new Error("El plazo de entrega debe ser un número de días hábiles entre 1 y 365.");
  }

  return parsed;
}

export function parseInitialPaymentPercent(value: unknown): number {
  const parsed = Math.trunc(Number(value));

  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 100) {
    throw new Error("El porcentaje de pago inicial debe estar entre 1% y 100%.");
  }

  return parsed;
}

export function remainingPaymentPercent(initialPercent: number): number {
  return Math.max(0, 100 - parseInitialPaymentPercent(initialPercent));
}

export type QuoteDepositAmounts = {
  percent: number;
  remainingPercent: number;
  subtotal: number;
  tax: number;
  total: number;
  isFull: boolean;
};

export function quoteDepositAmounts(input: {
  subtotal: number;
  tax: number;
  total: number;
  initialPaymentPercent: number;
}): QuoteDepositAmounts {
  const percent = parseInitialPaymentPercent(input.initialPaymentPercent);
  const quoteTotal = Math.round(Number(input.total) || 0);
  const quoteSubtotal = Math.round(Number(input.subtotal) || 0);
  const quoteTax = Math.round(Number(input.tax) || 0);

  if (percent >= 100) {
    return {
      percent,
      remainingPercent: 0,
      subtotal: quoteSubtotal,
      tax: quoteTax,
      total: quoteTotal,
      isFull: true,
    };
  }

  const total = Math.max(1, Math.round((quoteTotal * percent) / 100));
  const subtotal = Math.round((quoteSubtotal * percent) / 100);
  return {
    percent,
    remainingPercent: remainingPaymentPercent(percent),
    subtotal,
    tax: total - subtotal,
    total,
    isFull: false,
  };
}
