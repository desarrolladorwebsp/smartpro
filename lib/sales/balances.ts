export const SALE_COLLECTION_STATUSES = ["UNPAID", "PARTIAL", "PAID"] as const;
export type SaleCollectionStatus = (typeof SALE_COLLECTION_STATUSES)[number];

export function roundClp(value: number): number {
  return Math.round(Number(value) || 0);
}

export function sumPaidAmount(payments: Array<{ amount: number }> | null | undefined): number {
  if (!payments?.length) return 0;
  return payments.reduce((sum, payment) => sum + roundClp(payment.amount), 0);
}

export function getBalanceDue(total: number, paidAmount: number): number {
  return Math.max(0, roundClp(total) - roundClp(paidAmount));
}

export function getCollectionStatus(total: number, paidAmount: number): SaleCollectionStatus {
  const paid = roundClp(paidAmount);
  if (paid <= 0) return "UNPAID";
  if (paid >= roundClp(total)) return "PAID";
  return "PARTIAL";
}

export function parseSalePaymentAmount(value: unknown, maxBalance: number): number {
  const raw = typeof value === "string" ? value.trim().replace(/\./g, "").replace(",", ".") : value;
  const amount = roundClp(Number(raw));

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("El monto del pago debe ser un número válido.");
  }

  const balance = Math.max(0, roundClp(maxBalance));
  if (amount > balance) {
    throw new Error("El abono no puede superar el saldo pendiente.");
  }

  return amount;
}

export const SALE_COLLECTION_STATUS_LABELS: Record<SaleCollectionStatus, string> = {
  UNPAID: "Pendiente",
  PARTIAL: "Parcial",
  PAID: "Pagada",
};

export function getSaleCollectionStatusLabel(status: SaleCollectionStatus): string {
  return SALE_COLLECTION_STATUS_LABELS[status] ?? status;
}
