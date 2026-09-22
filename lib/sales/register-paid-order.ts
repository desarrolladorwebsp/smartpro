import { Prisma } from "@prisma/client";

import { createClientRecord, findClientByEmail, getClientById, type ClientRecord } from "../clients/repository";
import type { CustomerOrder } from "../orders/repository";
import { canTransitionQuoteStatus } from "../quotes/status";
import { getQuoteById, updateQuoteStatus } from "../quotes/repository";
import { prisma } from "../db";
import {
  buildPaidOrderSaleDraft,
  isPaidOrderEligible,
  PaidOrderSaleValidationError,
  type PaidOrderSaleDraft,
} from "./from-order";
import { getSaleByOrderId, getSaleByQuoteId, type SaleRecord } from "./repository";
import { nextSaleNumber } from "./numbering";
import { isSalePaymentMethod, isSaleSource, isSaleStatus } from "./types";

export type RegisterPaidOrderSaleResult = {
  sale: SaleRecord | null;
  client: ClientRecord | null;
  duplicate: boolean;
  skipped: boolean;
};

function getPrisma() {
  if (!prisma) {
    throw new Error("No hay conexión a la base de datos.");
  }

  return prisma;
}

const saleInclude = {
  client: true,
  quote: true,
  order: true,
  executive: true,
} as const;

function toSaleRecordFromRow(row: Prisma.SaleGetPayload<{ include: typeof saleInclude }>): SaleRecord {
  const executiveName = row.executive
    ? `${row.executive.firstName} ${row.executive.lastName ?? ""}`.trim() || row.executive.email
    : "Sin asignar";

  return {
    id: row.id,
    number: row.number,
    status: isSaleStatus(row.status) ? row.status : "REGISTERED",
    source: isSaleSource(row.source) ? row.source : "ORDER_PAID",
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
    subtotal: Number(row.subtotal),
    tax: Number(row.tax),
    total: Number(row.total),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function nextNumber(): Promise<string> {
  const latest = await getPrisma().sale.findFirst({
    where: { number: { startsWith: `VEN-${new Date().getFullYear()}-` } },
    orderBy: { number: "desc" },
    select: { number: true },
  });

  return nextSaleNumber(latest?.number);
}

async function ensureClientForPaidOrder(draft: PaidOrderSaleDraft): Promise<ClientRecord> {
  const existing = await findClientByEmail(draft.clientEmail);
  if (existing) {
    return existing;
  }

  try {
    return await createClientRecord({
      companyName: draft.clientCompany,
      contactFirstName: draft.contactFirstName,
      contactLastName: draft.contactLastName,
      email: draft.clientEmail,
      phone: draft.clientPhone,
      status: "ACTIVO",
    });
  } catch (error) {
    const raced = await findClientByEmail(draft.clientEmail);
    if (raced) return raced;
    throw error;
  }
}

async function attachOrderToSale(saleId: string, draft: PaidOrderSaleDraft): Promise<SaleRecord> {
  const updated = await getPrisma().sale.update({
    where: { id: saleId },
    data: {
      orderId: draft.orderId,
      paymentMethod: draft.paymentMethod,
      observation: draft.observation,
    },
    include: saleInclude,
  });

  return toSaleRecordFromRow(updated);
}

async function markQuoteAccepted(quoteId: string) {
  const quote = await getQuoteById(quoteId);
  if (!quote) {
    throw new PaidOrderSaleValidationError("La cotización asociada no existe.");
  }

  if (quote.status === "ACCEPTED") {
    return quote;
  }

  if (canTransitionQuoteStatus(quote.status, "ACCEPTED")) {
    return updateQuoteStatus(quoteId, "ACCEPTED");
  }

  return quote;
}

async function resolveClientForSale(draft: PaidOrderSaleDraft): Promise<ClientRecord> {
  if (!draft.quoteId) {
    return ensureClientForPaidOrder(draft);
  }

  const quote = await markQuoteAccepted(draft.quoteId);
  const quoteClient = await getClientById(quote.clientId);
  if (!quoteClient) {
    throw new PaidOrderSaleValidationError("El cliente de la cotización no existe.");
  }

  return quoteClient;
}

export async function registerSaleFromPaidOrder(order: CustomerOrder): Promise<RegisterPaidOrderSaleResult> {
  const draft = buildPaidOrderSaleDraft(order);

  const existingByOrder = await getSaleByOrderId(draft.orderId);
  if (existingByOrder) {
    return { sale: existingByOrder, client: null, duplicate: true, skipped: false };
  }

  if (draft.quoteId) {
    const existingByQuote = await getSaleByQuoteId(draft.quoteId);
    if (existingByQuote) {
      const sale = existingByQuote.orderId ? existingByQuote : await attachOrderToSale(existingByQuote.id, draft);
      await markQuoteAccepted(draft.quoteId).catch((error) => {
        console.error("[smartpro:sales:from-order:quote]", error);
      });
      return { sale, client: null, duplicate: true, skipped: false };
    }
  }

  const client = await resolveClientForSale(draft);

  if (!client.id) {
    throw new PaidOrderSaleValidationError("No se pudo asociar un cliente a la venta.");
  }

  const number = await nextNumber();
  const db = getPrisma();

  try {
    const created = await db.sale.create({
      data: {
        number,
        status: "REGISTERED",
        source: draft.source,
        clientId: client.id,
        quoteId: draft.quoteId,
        orderId: draft.orderId,
        paymentMethod: draft.paymentMethod,
        executiveId: client.assignedExecutiveId,
        apiClientId: order.apiClientId ?? null,
        externalReference: order.apiExternalReference ?? "",
        createdByEmail: draft.createdByEmail,
        soldAt: new Date(),
        observation: draft.observation,
        subtotal: draft.subtotal,
        tax: draft.tax,
        total: draft.total,
      },
      include: saleInclude,
    });

    return { sale: toSaleRecordFromRow(created), client, duplicate: false, skipped: false };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const duplicate =
        (await getSaleByOrderId(draft.orderId)) ??
        (draft.quoteId ? await getSaleByQuoteId(draft.quoteId) : null);
      if (duplicate) {
        return { sale: duplicate, client, duplicate: true, skipped: false };
      }
    }
    throw error;
  }
}

export async function tryRegisterSaleFromPaidOrder(
  order: CustomerOrder | null | undefined,
): Promise<RegisterPaidOrderSaleResult> {
  if (!order || !isPaidOrderEligible(order)) {
    return { sale: null, client: null, duplicate: false, skipped: true };
  }

  try {
    return await registerSaleFromPaidOrder(order);
  } catch (error) {
    console.error("[smartpro:sales:from-order]", {
      orderId: order?.id ?? null,
      error: error instanceof Error ? error.message : error,
    });
    return { sale: null, client: null, duplicate: false, skipped: false };
  }
}
