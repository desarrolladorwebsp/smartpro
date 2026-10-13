import type { QuoteRecord } from "../quotes/types";
import {
  getBalanceDue,
  getCollectionStatus,
  sumPaidAmount,
  type SaleCollectionStatus,
} from "./balances";

export type { SaleCollectionStatus } from "./balances";
export { getSaleCollectionStatusLabel, SALE_COLLECTION_STATUSES, SALE_COLLECTION_STATUS_LABELS } from "./balances";

export type QuoteForSaleConversion = {
  quote: QuoteRecord;
  convertible: boolean;
  reason?: string;
};

export const SALE_STATUSES = ["REGISTERED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
export type SaleStatus = (typeof SALE_STATUSES)[number];

export const LIOREN_INVOICE_STATUSES = ["NOT_ISSUED", "ISSUING", "ISSUED", "ERROR"] as const;
export type LiorenInvoiceStatus = (typeof LIOREN_INVOICE_STATUSES)[number];
export type LiorenInvoiceType = "33" | "34";

export type LiorenInvoiceDetail = {
  codigo: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  precio: number;
  exento: boolean;
};

export type LiorenInvoiceDraft = {
  tipoDocumento: LiorenInvoiceType;
  fecha: string;
  vencimiento: string;
  observaciones: string;
  receptor: {
    rut: string;
    rs: string;
    giro: string;
    comuna: string;
    ciudad: string;
    direccion: string;
    email: string;
    telefono: string;
  };
  detalles: LiorenInvoiceDetail[];
};

export type LiorenInvoiceRecord = {
  status: LiorenInvoiceStatus;
  type: LiorenInvoiceType | null;
  documentId: number | null;
  folio: number | null;
  issuedAt: string | null;
  error: string;
  draft: LiorenInvoiceDraft | null;
};

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

export const SALE_MANUAL_PAYMENT_METHODS = ["transfer", "cash", "other"] as const;
export type SaleManualPaymentMethod = (typeof SALE_MANUAL_PAYMENT_METHODS)[number];

export function isSaleManualPaymentMethod(value: unknown): value is SaleManualPaymentMethod {
  return SALE_MANUAL_PAYMENT_METHODS.includes(value as SaleManualPaymentMethod);
}

export const SALE_PAYMENT_SOURCES = ["ORDER_PAID", "MANUAL", "EXTERNAL_API"] as const;
export type SalePaymentSource = (typeof SALE_PAYMENT_SOURCES)[number];

export function isSalePaymentSource(value: unknown): value is SalePaymentSource {
  return SALE_PAYMENT_SOURCES.includes(value as SalePaymentSource);
}

export type SalePaymentRecord = {
  id: string;
  saleId: string;
  amount: number;
  method: SalePaymentMethod;
  paidAt: string;
  receiptPath: string;
  receiptFileName: string;
  orderId: string | null;
  source: SalePaymentSource;
  createdByEmail: string;
  observation: string;
};

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
  liorenInvoice: LiorenInvoiceRecord;
  paidAmount: number;
  balanceDue: number;
  collectionStatus: SaleCollectionStatus;
  payments: SalePaymentRecord[];
  createdAt: string;
  updatedAt: string;
};

export function withSalePaymentTotals<T extends Pick<SaleRecord, "total" | "payments" | "receiptPath" | "receiptFileName">>(
  sale: T,
): T & Pick<SaleRecord, "paidAmount" | "balanceDue" | "collectionStatus" | "receiptPath" | "receiptFileName"> {
  const paidAmount = sumPaidAmount(sale.payments);
  const lastReceipt = [...(sale.payments ?? [])].reverse().find((payment) => payment.receiptPath);

  return {
    ...sale,
    paidAmount,
    balanceDue: getBalanceDue(sale.total, paidAmount),
    collectionStatus: getCollectionStatus(sale.total, paidAmount),
    receiptPath: lastReceipt?.receiptPath || sale.receiptPath,
    receiptFileName: lastReceipt?.receiptFileName || sale.receiptFileName,
  };
}

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
