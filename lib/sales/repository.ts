import { Prisma } from "@prisma/client";

import { prisma } from "../db";
import { getClientById } from "../clients/repository";
import { getQuoteById, listQuotesByClientId } from "../quotes/repository";
import { assertQuoteConvertible, getQuoteSaleConversionCheck } from "./conversion";
import { nextSaleNumber } from "./numbering";
import { saveSaleReceiptUpload, validateSaleReceiptUpload } from "./receipt";
import {
  isSalePaymentMethod,
  isSaleSource,
  isSaleStatus,
  parseSaleObservation,
  type QuoteForSaleConversion,
  type SalePaymentMethod,
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

function toSaleRecord(row: SaleRow): SaleRecord {
  const executiveName = row.executive
    ? `${row.executive.firstName} ${row.executive.lastName ?? ""}`.trim() || row.executive.email
    : "Sin asignar";

  return {
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
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const saleInclude = {
  client: true,
  quote: true,
  order: true,
  executive: true,
} as const;

async function nextNumber(): Promise<string> {
  const latest = await getPrisma().sale.findFirst({
    where: { number: { startsWith: `VEN-${new Date().getFullYear()}-` } },
    orderBy: { number: "desc" },
    select: { number: true },
  });

  return nextSaleNumber(latest?.number);
}

async function resolveExecutiveId(assignedExecutiveId: string | null, createdByEmail: string): Promise<string | null> {
  if (assignedExecutiveId) return assignedExecutiveId;

  const user = await getPrisma().user.findUnique({
    where: { email: createdByEmail },
    select: { id: true },
  });

  return user?.id ?? null;
}

export async function listSales(): Promise<SaleRecord[]> {
  const rows = await getPrisma().sale.findMany({
    include: saleInclude,
    orderBy: { soldAt: "desc" },
  });

  return rows.map(toSaleRecord);
}

export async function getSaleByQuoteId(quoteId: string): Promise<SaleRecord | null> {
  const id = String(quoteId ?? "").trim();
  if (!id) return null;

  const row = await getPrisma().sale.findUnique({
    where: { quoteId: id },
    include: saleInclude,
  });

  return row ? toSaleRecord(row) : null;
}

export async function getSaleById(id: string): Promise<SaleRecord | null> {
  const saleId = String(id ?? "").trim();
  if (!saleId) return null;

  const row = await getPrisma().sale.findUnique({
    where: { id: saleId },
    include: saleInclude,
  });

  return row ? toSaleRecord(row) : null;
}

export async function listSalesByApiClientId(apiClientId: string): Promise<SaleRecord[]> {
  const rows = await getPrisma().sale.findMany({
    where: { apiClientId },
    include: saleInclude,
    orderBy: { soldAt: "desc" },
  });

  return rows.map(toSaleRecord);
}

export async function findSaleByExternalReference(
  apiClientId: string,
  externalReference: string,
): Promise<SaleRecord | null> {
  const reference = String(externalReference ?? "").trim();
  if (!reference) return null;

  const row = await getPrisma().sale.findFirst({
    where: { apiClientId, externalReference: reference },
    include: saleInclude,
  });

  return row ? toSaleRecord(row) : null;
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

  return toSaleRecord(created);
}

export async function getSaleByOrderId(orderId: string): Promise<SaleRecord | null> {
  const id = String(orderId ?? "").trim();
  if (!id) return null;

  const row = await getPrisma().sale.findUnique({
    where: { orderId: id },
    include: saleInclude,
  });

  return row ? toSaleRecord(row) : null;
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
        subtotal: quote.subtotal,
        tax: quote.tax,
        total: quote.total,
      },
      include: saleInclude,
    });

    if (!receipt) {
      return toSaleRecord(created);
    }

    try {
      const savedReceipt = await saveSaleReceiptUpload(created.id, receipt);
      const updated = await db.sale.update({
        where: { id: created.id },
        data: { receiptPath: savedReceipt.path, receiptFileName: savedReceipt.fileName },
        include: saleInclude,
      });
      return toSaleRecord(updated);
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

/** Punto de entrada para convertir una cotización aceptada. No registra pagos. */
export async function convertAcceptedQuoteToSale(quoteId: string, createdByEmail: string): Promise<SaleRecord> {
  return convertQuoteToSale({
    quoteId,
    createdByEmail,
    source: "QUOTE_ACCEPTED",
  });
}
