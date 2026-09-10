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
