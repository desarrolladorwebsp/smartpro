import { Prisma } from "@prisma/client";

import { prisma } from "../db";
import { getClientById } from "../clients/repository";
import { getQuoteById, listQuotesByClientId } from "../quotes/repository";
import { assertQuoteConvertible, getQuoteSaleConversionCheck } from "./conversion";
import { nextSaleNumber } from "./numbering";
import { parseSalePaymentAmount } from "./balances";
import { saveSaleReceiptUpload, validateSaleReceiptUpload } from "./receipt";
import { withSalePaymentTable } from "./schema";
import { buildSalesSummary } from "./summary";
import type { SalesPeriod } from "./summary";
import {
  isSaleManualPaymentMethod,
  isSalePaymentMethod,
  isSalePaymentSource,
  isSaleSource,
  isSaleStatus,
  parseSaleObservation,
  withSalePaymentTotals,
  type QuoteForSaleConversion,
  type SaleManualPaymentMethod,
  type SalePaymentMethod,
  type SalePaymentRecord,
  type SalePaymentSource,
  type SaleRecord,
  type SaleSource,
} from "./types";

export { getSaleStatusLabel, type QuoteForSaleConversion, type SaleRecord, type SaleSource, type SaleStatus } from "./types";

type SaleRow = Prisma.SaleGetPayload<{
  include: {
    client: true;
    quote: true;
    order: true;
    executive: true;
    payments: true;
  };
}>;

function getPrisma() {
  if (!prisma) {
    throw new Error("No hay conexión a la base de datos.");
  }

  return prisma;
}

function decimalToNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value == null) return 0;
  return Number(value);
}

function toPaymentRecord(row: SaleRow["payments"][number]): SalePaymentRecord {
  return {
    id: row.id,
    saleId: row.saleId,
    amount: decimalToNumber(row.amount),
    method: isSalePaymentMethod(row.method) ? row.method : "other",
    paidAt: row.paidAt.toISOString(),
    receiptPath: row.receiptPath,
    receiptFileName: row.receiptFileName,
    orderId: row.orderId ?? null,
    source: isSalePaymentSource(row.source) ? row.source : "MANUAL",
    createdByEmail: row.createdByEmail,
    observation: row.observation,
  };
}

function toSaleRecord(row: SaleRow): SaleRecord {
  const executiveName = row.executive
    ? `${row.executive.firstName} ${row.executive.lastName ?? ""}`.trim() || row.executive.email
    : "Sin asignar";

  const payments = [...row.payments]
    .sort((a, b) => a.paidAt.getTime() - b.paidAt.getTime())
    .map(toPaymentRecord);

  return withSalePaymentTotals({
    id: row.id,
    number: row.number,
    status: isSaleStatus(row.status) ? row.status : "REGISTERED",
    source: isSaleSource(row.source) ? row.source : "MANUAL",
    clientId: row.clientId,
    clientCompany: row.client.companyName,
    clientName: `${row.client.contactFirstName} ${row.client.contactLastName}`.trim(),
    quoteId: row.quoteId ?? null,
    quoteNumber: row.quote?.number ?? null,
    orderId: row.orderId ?? row.order?.id ?? null,
    paymentMethod: isSalePaymentMethod(row.paymentMethod) ? row.paymentMethod : null,
    executiveId: row.executiveId,
    executiveName,
    apiClientId: row.apiClientId ?? null,
    externalReference: row.externalReference,
    createdByEmail: row.createdByEmail,
    soldAt: row.soldAt.toISOString(),
    observation: row.observation,
    receiptPath: row.receiptPath,
    receiptFileName: row.receiptFileName,
    subtotal: decimalToNumber(row.subtotal),
    tax: decimalToNumber(row.tax),
    total: decimalToNumber(row.total),
    payments,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

const saleInclude = {
  client: true,
  quote: true,
  order: true,
  executive: true,
  payments: true,
} as const;

async function nextNumber(): Promise<string> {
  const latest = await getPrisma().sale.findFirst({
    where: { number: { startsWith: `VEN-${new Date().getFullYear()}-` } },
    orderBy: { number: "desc" },
    select: { number: true },
  });

  return nextSaleNumber(latest?.number);
}

function parseDirectSaleAmount(value: unknown, label: string): number {
  const raw = String(value ?? "").trim();
  const amount = raw ? Number(raw) : 0;

  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new Error(`${label} debe ser un monto válido en pesos.`);
  }

  return amount;
}

function parseDirectSaleDate(value: unknown): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  const raw = String(value ?? "").trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (match) {
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12));
    if (date.toISOString().slice(0, 10) === raw) return date;
  }

  throw new Error("Ingresa una fecha de venta válida.");
}

async function resolveExecutiveId(assignedExecutiveId: string | null, createdByEmail: string): Promise<string | null> {
  if (assignedExecutiveId) return assignedExecutiveId;

  const user = await getPrisma().user.findUnique({
    where: { email: createdByEmail },
    select: { id: true },
  });

  return user?.id ?? null;
}

export type SalePaymentInput = {
  amount: number;
  method: SalePaymentMethod;
  source: SalePaymentSource;
  createdByEmail: string;
  observation?: string;
  orderId?: string | null;
  receipt?: File | null;
  paidAt?: Date;
};

async function persistSalePayment(saleId: string, input: SalePaymentInput): Promise<SaleRecord> {
  return withSalePaymentTable(() => persistSalePaymentOnce(saleId, input));
}

async function persistSalePaymentOnce(saleId: string, input: SalePaymentInput): Promise<SaleRecord> {
  const db = getPrisma();
  const created = await db.salePayment.create({
    data: {
      saleId,
      amount: input.amount,
      method: input.method,
      source: input.source,
      createdByEmail: input.createdByEmail,
      observation: parseSaleObservation(input.observation),
      orderId: input.orderId ?? null,
      paidAt: input.paidAt ?? new Date(),
    },
  });

  let receiptPath = "";
  let receiptFileName = "";
  if (input.receipt && input.receipt.size > 0) {
    try {
      const saved = await saveSaleReceiptUpload(created.id, input.receipt);
      receiptPath = saved.path;
      receiptFileName = saved.fileName;
      await db.salePayment.update({
        where: { id: created.id },
        data: { receiptPath, receiptFileName },
      });
    } catch (error) {
      await db.salePayment.delete({ where: { id: created.id } }).catch(() => undefined);
      throw error;
    }
  }

  await db.sale.update({
    where: { id: saleId },
    data: {
      paymentMethod: input.method,
      ...(receiptPath
        ? { receiptPath, receiptFileName }
        : {}),
    },
  });

  const sale = await getSaleById(saleId);
  if (!sale) {
    throw new Error("No se pudo cargar la venta después de registrar el pago.");
  }
  return sale;
}

export async function addSalePayment(
  saleId: string,
  input: {
    amount: unknown;
    method: unknown;
    createdByEmail: string;
    observation?: string;
    receipt?: File | null;
  },
): Promise<SaleRecord> {
  const sale = await getSaleById(saleId);
  if (!sale) {
    throw new Error("La venta no existe.");
  }
  if (sale.status === "CANCELLED") {
    throw new Error("No se pueden registrar abonos en una venta cancelada.");
  }

  const amount = parseSalePaymentAmount(input.amount, sale.balanceDue);
  if (amount < 1) {
    throw new Error("El abono debe ser mayor a 0.");
  }
  if (!isSaleManualPaymentMethod(input.method)) {
    throw new Error("Selecciona un medio de pago válido.");
  }

  const receipt = input.receipt && input.receipt.size > 0 ? input.receipt : null;
  if (receipt) {
    validateSaleReceiptUpload(receipt);
  }

  return persistSalePayment(sale.id, {
    amount,
    method: input.method,
    source: "MANUAL",
    createdByEmail: String(input.createdByEmail ?? "").trim().toLowerCase(),
    observation: input.observation,
    receipt,
  });
}

export async function getSalesSummary(period?: SalesPeriod) {
  return buildSalesSummary(await listSales(), new Date(), period);
}

export async function recordPaidOrderPayment(input: {
  saleId: string;
  amount: number;
  method: SalePaymentMethod;
  orderId: string;
  createdByEmail: string;
  observation: string;
}): Promise<SaleRecord> {
  return withSalePaymentTable(() => recordPaidOrderPaymentOnce(input));
}

async function recordPaidOrderPaymentOnce(input: {
  saleId: string;
  amount: number;
  method: SalePaymentMethod;
  orderId: string;
  createdByEmail: string;
  observation: string;
}): Promise<SaleRecord> {
  const existing = await getPrisma().salePayment.findUnique({
    where: { orderId: input.orderId },
  });
  if (existing) {
    const sale = await getSaleById(input.saleId);
    if (!sale) throw new Error("La venta no existe.");
    return sale;
  }

  const sale = await getSaleById(input.saleId);
  if (!sale) throw new Error("La venta no existe.");
  const amount = parseSalePaymentAmount(input.amount, sale.balanceDue);
  if (amount < 1) return sale;

  return persistSalePayment(sale.id, {
    amount,
    method: input.method,
    source: "ORDER_PAID",
    createdByEmail: input.createdByEmail,
    observation: input.observation,
    orderId: input.orderId,
  });
}

export async function listSales(): Promise<SaleRecord[]> {
  return withSalePaymentTable(async () => {
    const rows = await getPrisma().sale.findMany({
      include: saleInclude,
      orderBy: { soldAt: "desc" },
    });

    return rows.map(toSaleRecord);
  });
}

export async function getSaleByQuoteId(quoteId: string): Promise<SaleRecord | null> {
  const id = String(quoteId ?? "").trim();
  if (!id) return null;

  return withSalePaymentTable(async () => {
    const row = await getPrisma().sale.findUnique({
      where: { quoteId: id },
      include: saleInclude,
    });

    return row ? toSaleRecord(row) : null;
  });
}

export async function getSaleById(id: string): Promise<SaleRecord | null> {
  const saleId = String(id ?? "").trim();
  if (!saleId) return null;

  return withSalePaymentTable(async () => {
    const row = await getPrisma().sale.findUnique({
      where: { id: saleId },
      include: saleInclude,
    });

    return row ? toSaleRecord(row) : null;
  });
}

export async function listSalesByApiClientId(apiClientId: string): Promise<SaleRecord[]> {
  return withSalePaymentTable(async () => {
    const rows = await getPrisma().sale.findMany({
      where: { apiClientId },
      include: saleInclude,
      orderBy: { soldAt: "desc" },
    });

    return rows.map(toSaleRecord);
  });
}

export async function findSaleByExternalReference(
  apiClientId: string,
  externalReference: string,
): Promise<SaleRecord | null> {
  const reference = String(externalReference ?? "").trim();
  if (!reference) return null;

  return withSalePaymentTable(async () => {
    const row = await getPrisma().sale.findFirst({
      where: { apiClientId, externalReference: reference },
      include: saleInclude,
    });

    return row ? toSaleRecord(row) : null;
  });
}

export type ExternalSaleInput = {
  apiClientId: string;
  clientId: string;
  assignedExecutiveId: string | null;
  createdByEmail: string;
  paymentMethod: SalePaymentMethod;
  subtotal: number;
  tax: number;
  total: number;
  soldAt: Date;
  observation: string;
  externalReference: string;
};

/// Registra una venta cerrada fuera del pago en línea (transferencia, efectivo
/// o acuerdo directo) reportada por una aplicación externa autorizada.
export async function createExternalSale(input: ExternalSaleInput): Promise<SaleRecord> {
  const number = await nextNumber();

  const created = await getPrisma().sale.create({
    data: {
      number,
      status: "REGISTERED",
      source: "EXTERNAL_API",
      clientId: input.clientId,
      executiveId: input.assignedExecutiveId,
      apiClientId: input.apiClientId,
      externalReference: input.externalReference,
      paymentMethod: input.paymentMethod,
      createdByEmail: input.createdByEmail,
      soldAt: input.soldAt,
      observation: input.observation,
      subtotal: input.subtotal,
      tax: input.tax,
      total: input.total,
    },
    include: saleInclude,
  });

  return persistSalePayment(created.id, {
    amount: input.total,
    method: input.paymentMethod,
    source: "EXTERNAL_API",
    createdByEmail: input.createdByEmail,
    observation: input.observation,
    paidAt: input.soldAt,
  });
}

export async function getSaleByOrderId(orderId: string): Promise<SaleRecord | null> {
  const id = String(orderId ?? "").trim();
  if (!id) return null;

  return withSalePaymentTable(async () => {
    const row = await getPrisma().sale.findUnique({
      where: { orderId: id },
      include: saleInclude,
    });

    return row ? toSaleRecord(row) : null;
  });
}

export async function listQuotesForSaleConversion(clientId: string): Promise<QuoteForSaleConversion[]> {
  const [quotes, converted] = await Promise.all([
    listQuotesByClientId(clientId),
    getPrisma().sale.findMany({ where: { clientId }, select: { quoteId: true } }),
  ]);

  const convertedIds = new Set(converted.map((entry) => entry.quoteId).filter((id): id is string => Boolean(id)));

  return quotes.map((quote) => ({
    quote,
    ...getQuoteSaleConversionCheck(quote.status, convertedIds.has(quote.id), "MANUAL"),
  }));
}

export async function convertQuoteToSale(input: {
  quoteId: string;
  createdByEmail: string;
  observation?: string;
  receipt?: File | null;
  source?: SaleSource;
  paidAmount?: unknown;
  paymentMethod?: unknown;
}): Promise<SaleRecord> {
  const source = input.source ?? "MANUAL";
  const createdByEmail = String(input.createdByEmail ?? "").trim().toLowerCase();
  if (!createdByEmail) {
    throw new Error("No se pudo identificar al ejecutivo.");
  }

  const quote = await getQuoteById(input.quoteId);
  if (!quote) {
    throw new Error("La cotización no existe.");
  }

  const existing = await getSaleByQuoteId(quote.id);
  assertQuoteConvertible(quote.status, Boolean(existing), source);

  const client = await getClientById(quote.clientId);
  if (!client) {
    throw new Error("El cliente de la cotización no existe.");
  }

  const observation = parseSaleObservation(input.observation);
  const receipt = input.receipt && input.receipt.size > 0 ? input.receipt : null;
  if (receipt) {
    validateSaleReceiptUpload(receipt);
  }
  const paidAmount = parseSalePaymentAmount(input.paidAmount ?? 0, quote.total);
  let paymentMethod: SaleManualPaymentMethod | null = null;
  if (paidAmount > 0) {
    if (!isSaleManualPaymentMethod(input.paymentMethod)) {
      throw new Error("Selecciona un medio de pago para el monto recibido.");
    }
    paymentMethod = input.paymentMethod;
  }

  const executiveId = await resolveExecutiveId(client.assignedExecutiveId, createdByEmail);
  const number = await nextNumber();
  const db = getPrisma();

  try {
    const created = await db.sale.create({
      data: {
        number,
        status: "REGISTERED",
        source,
        clientId: client.id,
        quoteId: quote.id,
        executiveId,
        createdByEmail,
        observation,
        paymentMethod,
        subtotal: quote.subtotal,
        tax: quote.tax,
        total: quote.total,
      },
      include: saleInclude,
    });

    if (paidAmount < 1) {
      return toSaleRecord(created);
    }

    try {
      return await persistSalePayment(created.id, {
        amount: paidAmount,
        method: paymentMethod ?? "other",
        source: "MANUAL",
        createdByEmail,
        observation,
        receipt,
      });
    } catch (error) {
      await db.sale.delete({ where: { id: created.id } }).catch(() => undefined);
      throw error;
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Esta cotización ya fue convertida en venta.");
    }
    throw error;
  }
}

/** Registra una venta manual directamente, sin cotización ni orden asociada. */
export async function createDirectSale(input: {
  clientId: string;
  serviceName: string;
  subtotal: unknown;
  tax?: unknown;
  soldAt?: unknown;
  createdByEmail: string;
  observation?: string;
  receipt?: File | null;
  paidAmount?: unknown;
  paymentMethod?: unknown;
}): Promise<SaleRecord> {
  return withSalePaymentTable(async () => {
    const clientId = String(input.clientId ?? "").trim();
    if (!clientId) throw new Error("Selecciona un cliente.");

    const client = await getClientById(clientId);
    if (!client) throw new Error("El cliente de la venta no existe.");

    const serviceName = String(input.serviceName ?? "").trim();
    if (!serviceName) throw new Error("Describe el servicio de la venta.");
    if (serviceName.length > 160) throw new Error("El detalle del servicio no puede superar 160 caracteres.");

    const subtotal = parseDirectSaleAmount(input.subtotal, "El subtotal");
    const tax = parseDirectSaleAmount(input.tax ?? 0, "El IVA");
    const total = subtotal + tax;
    if (subtotal < 1 || total < 1) throw new Error("El subtotal de la venta debe ser mayor a 0.");

    const createdByEmail = String(input.createdByEmail ?? "").trim().toLowerCase();
    if (!createdByEmail) throw new Error("No se pudo identificar al ejecutivo.");

    const observation = parseSaleObservation(
      [`Servicio: ${serviceName}`, String(input.observation ?? "").trim()].filter(Boolean).join("\n\n"),
    );
    const receipt = input.receipt && input.receipt.size > 0 ? input.receipt : null;
    if (receipt) validateSaleReceiptUpload(receipt);

    const soldAt = input.soldAt == null || input.soldAt === "" ? new Date() : parseDirectSaleDate(input.soldAt);
    const paidAmount = parseDirectSaleAmount(input.paidAmount ?? 0, "El monto recibido");
    if (paidAmount > total) throw new Error("El abono no puede superar el total de la venta.");
    let paymentMethod: SaleManualPaymentMethod | null = null;
    if (paidAmount > 0) {
      paymentMethod = isSaleManualPaymentMethod(input.paymentMethod) ? input.paymentMethod : "other";
    }

    const executiveId = await resolveExecutiveId(client.assignedExecutiveId, createdByEmail);
    const number = await nextNumber();
    const db = getPrisma();
    const created = await db.sale.create({
      data: {
        number,
        status: "REGISTERED",
        source: "MANUAL",
        clientId: client.id,
        executiveId,
        createdByEmail,
        soldAt,
        observation,
        paymentMethod,
        subtotal,
        tax,
        total,
      },
      include: saleInclude,
    });

    if (paidAmount < 1) {
      const sale = toSaleRecord(created);
      return sale;
    }

    try {
      const sale = await persistSalePayment(created.id, {
        amount: paidAmount,
        method: paymentMethod ?? "other",
        source: "MANUAL",
        createdByEmail,
        observation,
        receipt,
        paidAt: soldAt,
      });
      return sale;
    } catch (error) {
      await db.sale.delete({ where: { id: created.id } }).catch(() => undefined);
      throw error;
    }
  });
}

/** Punto de entrada para convertir una cotización aceptada. No registra pagos. */
export async function convertAcceptedQuoteToSale(quoteId: string, createdByEmail: string): Promise<SaleRecord> {
  return convertQuoteToSale({
    quoteId,
    createdByEmail,
    source: "QUOTE_ACCEPTED",
  });
}
