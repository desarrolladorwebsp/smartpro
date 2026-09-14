import type { CustomerOrder } from "../orders/repository";
import type { SalePaymentMethod, SaleSource } from "./types";

export const ONLINE_SALE_CREATED_BY_EMAIL = "checkout@smartpro.cl";

export type PaidOrderSaleDraft = {
  orderId: string;
  quoteId: string | null;
  clientEmail: string;
  clientName: string;
  clientPhone: string;
  clientCompany: string;
  contactFirstName: string;
  contactLastName: string;
  paymentMethod: SalePaymentMethod;
  subtotal: number;
  tax: number;
  total: number;
  soldAt: string;
  source: Extract<SaleSource, "ORDER_PAID">;
  createdByEmail: string;
  observation: string;
};

export class PaidOrderSaleValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaidOrderSaleValidationError";
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAYMENT_METHODS: SalePaymentMethod[] = ["transbank", "mercadopago", "simulated"];

function asTrimmedString(value: unknown, field: string, required = true): string {
  if (value == null) {
    if (!required) return "";
    throw new PaidOrderSaleValidationError(`Falta ${field}.`);
  }

  if (typeof value !== "string") {
    throw new PaidOrderSaleValidationError(`${field} debe ser texto.`);
  }

  const trimmed = value.trim();
  if (required && !trimmed) {
    throw new PaidOrderSaleValidationError(`Falta ${field}.`);
  }

  return trimmed;
}

function asMoney(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new PaidOrderSaleValidationError(`${field} debe ser un número válido.`);
  }

  if (value < 0) {
    throw new PaidOrderSaleValidationError(`${field} no puede ser negativo.`);
  }

  return Math.round(value);
}

function splitContactName(fullName: string) {
  const parts = fullName.split(/\s+/).filter(Boolean);
  const contactFirstName = parts[0] ?? "";
  const contactLastName = parts.slice(1).join(" ") || contactFirstName;

  if (!contactFirstName || !contactLastName) {
    throw new PaidOrderSaleValidationError("El nombre del cliente es obligatorio.");
  }

  return { contactFirstName, contactLastName };
}

export function isPaidOrderEligible(order: Pick<CustomerOrder, "paymentStatus"> | null | undefined): boolean {
  return order?.paymentStatus === "paid";
}

export function buildPaidOrderSaleDraft(order: CustomerOrder | null | undefined): PaidOrderSaleDraft {
  if (!order || typeof order !== "object") {
    throw new PaidOrderSaleValidationError("La orden pagada no es válida.");
  }

  if (order.paymentStatus !== "paid") {
    throw new PaidOrderSaleValidationError("Solo se puede registrar una venta de una orden pagada.");
  }

  const orderId = asTrimmedString(order.id, "el identificador de la orden");
  const clientEmail = asTrimmedString(order.customer?.email, "el email del cliente").toLowerCase();
  if (!EMAIL_PATTERN.test(clientEmail)) {
    throw new PaidOrderSaleValidationError("El email del cliente no es válido.");
  }

  const clientName = asTrimmedString(order.customer?.name, "el nombre del cliente");
  const clientPhone = asTrimmedString(order.customer?.phone, "el teléfono del cliente", false);
  const clientCompany = asTrimmedString(order.customer?.company, "la empresa del cliente", false) || clientName;
  const { contactFirstName, contactLastName } = splitContactName(clientName);

  if (!PAYMENT_METHODS.includes(order.paymentMethod)) {
    throw new PaidOrderSaleValidationError("El método de pago de la orden no es válido.");
  }

  const subtotal = asMoney(order.subtotal, "El subtotal");
  const tax = asMoney(order.tax, "El IVA");
  const total = asMoney(order.total, "El total");

  if (total < 1) {
    throw new PaidOrderSaleValidationError("El total de la venta debe ser mayor a 0.");
  }

  if (Math.round(subtotal + tax) !== total) {
    throw new PaidOrderSaleValidationError("Los montos de la orden no coinciden.");
  }

  const quoteIdRaw = order.quoteId == null || order.quoteId === "" ? null : order.quoteId;
  if (quoteIdRaw != null && typeof quoteIdRaw !== "string") {
    throw new PaidOrderSaleValidationError("La cotización asociada no es válida.");
  }

  const quoteId = quoteIdRaw ? asTrimmedString(quoteIdRaw, "la cotización asociada") : null;
  const soldAt = asTrimmedString(order.createdAt, "la fecha de la orden");
  if (Number.isNaN(new Date(soldAt).getTime())) {
    throw new PaidOrderSaleValidationError("La fecha de la orden no es válida.");
  }

  return {
    orderId,
    quoteId,
    clientEmail,
    clientName,
    clientPhone,
    clientCompany,
    contactFirstName,
    contactLastName,
    paymentMethod: order.paymentMethod,
    subtotal,
    tax,
    total,
    soldAt,
    source: "ORDER_PAID",
    createdByEmail: ONLINE_SALE_CREATED_BY_EMAIL,
    observation: `Pago en línea ${order.paymentMethod === "mercadopago" ? "Mercado Pago" : order.paymentMethod === "transbank" ? "Webpay" : "simulado"} — ${orderId}`,
  };
}
