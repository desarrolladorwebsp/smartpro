import type { QuoteRecord } from "../quotes/types";

export type QuoteForSaleConversion = {
  quote: QuoteRecord;
  convertible: boolean;
  reason?: string;
};

export const SALE_STATUSES = ["REGISTERED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
export type SaleStatus = (typeof SALE_STATUSES)[number];

export const SALE_RECEIPT_MAX_BYTES = 5 * 1024 * 1024;
export const SALE_RECEIPT_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;
export const SALE_RECEIPT_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp";
export const SALE_OBSERVATION_MAX_LENGTH = 2000;

export const SALE_SOURCES = ["MANUAL", "QUOTE_ACCEPTED", "ORDER_PAID", "EXTERNAL_API"] as const;
export type SaleSource = (typeof SALE_SOURCES)[number];

export const SALE_PAYMENT_METHODS = [
  "simulated",
  "transbank",
  "mercadopago",
  "transfer",
  "cash",
  "other",
] as const;
export type SalePaymentMethod = (typeof SALE_PAYMENT_METHODS)[number];

export const SALE_PAYMENT_METHOD_LABELS: Record<SalePaymentMethod, string> = {
  simulated: "Simulado",
  transbank: "Webpay",
  mercadopago: "Mercado Pago",
  transfer: "Transferencia bancaria",
  cash: "Efectivo",
  other: "Otro medio",
};

export function isSalePaymentMethod(value: unknown): value is SalePaymentMethod {
  return SALE_PAYMENT_METHODS.includes(value as SalePaymentMethod);
}

export function getSalePaymentMethodLabel(method: SalePaymentMethod | null | undefined): string {
  if (!method) return "—";
  return SALE_PAYMENT_METHOD_LABELS[method] ?? method;
}

export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  REGISTERED: "Registrada",
  IN_PROGRESS: "En progreso",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

export type SaleRecord = {
  id: string;
  number: string;
  status: SaleStatus;
  source: SaleSource;
  clientId: string;
  clientCompany: string;
  clientName: string;
  quoteId: string | null;
  quoteNumber: string | null;
  orderId: string | null;
  paymentMethod: SalePaymentMethod | null;
  executiveId: string | null;
  executiveName: string;
  apiClientId: string | null;
  externalReference: string;
  createdByEmail: string;
  soldAt: string;
  observation: string;
  receiptPath: string;
  receiptFileName: string;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  updatedAt: string;
};

export function isSaleStatus(value: unknown): value is SaleStatus {
  return SALE_STATUSES.includes(value as SaleStatus);
}

export function getSaleStatusLabel(status: SaleStatus): string {
  return SALE_STATUS_LABELS[status] ?? status;
}

export function isSaleSource(value: unknown): value is SaleSource {
  return SALE_SOURCES.includes(value as SaleSource);
}

export function parseSaleObservation(value: unknown): string {
  const observation = String(value ?? "").trim();
  if (observation.length > SALE_OBSERVATION_MAX_LENGTH) {
    throw new Error("La observación no puede superar 2000 caracteres.");
  }
  return observation;
}

export function getSaleReceiptValidationError(file: Pick<File, "size" | "type"> | null | undefined): string | null {
  if (!file || file.size <= 0) {
    return null;
  }

  if (file.size > SALE_RECEIPT_MAX_BYTES) {
    return "El comprobante no puede superar 5 MB.";
  }

  if (!(SALE_RECEIPT_MIME_TYPES as readonly string[]).includes(file.type)) {
    return "Formato no permitido. Usa PDF, JPG, PNG o WEBP.";
  }

  return null;
}
