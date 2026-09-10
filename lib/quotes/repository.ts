import { Prisma } from "@prisma/client";

import { prisma } from "../db";
import { getClientById } from "../clients/repository";
import { formatCurrency, TAX_RATE } from "../orders/service";
import { getServicePlanById } from "../services/repository";
import { QUOTE_DEFAULT_DELIVERY_DAYS, QUOTE_DEFAULT_INITIAL_PAYMENT_PERCENT, QUOTE_DEFAULT_VALIDITY_DAYS } from "./company";
import { parseQuoteValidUntil } from "./dates";
import { parseDeliveryBusinessDays, parseInitialPaymentPercent } from "./fields";
import { nextQuoteNumber } from "./numbering";
import { assertQuoteStatusTransition, parseQuoteStatus } from "./status";
import type {
  QuoteItemInput,
  QuoteItemRecord,
  QuoteListFilters,
  QuoteRecord,
  QuoteStatus,
} from "./types";
import { isQuoteStatus } from "./types";

type QuoteRow = Prisma.QuoteGetPayload<{
  include: {
    client: true;
    items: true;
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

function parseIncludedItems(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => String(entry ?? "").trim()).filter(Boolean);
}

function formatClientAddress(client: {
  address: string;
  commune: string;
  city: string;
  region: string;
}): string {
  return [client.address, client.commune, client.city, client.region].filter(Boolean).join(", ");
}

function toQuoteRecord(row: QuoteRow): QuoteRecord {
  const items = [...row.items]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((item) => ({
      id: item.id,
      planId: item.planId,
      planName: item.planName,
      categoryName: item.categoryName,
      subcategoryName: item.subcategoryName,
      quantity: item.quantity,
      unitPrice: decimalToNumber(item.unitPrice),
      taxRate: decimalToNumber(item.taxRate),
      includedItems: parseIncludedItems(item.includedItems),
      subtotal: decimalToNumber(item.subtotal),
      tax: decimalToNumber(item.tax),
      total: decimalToNumber(item.total),
      sortOrder: item.sortOrder,
    }));

  return {
    id: row.id,
    number: row.number,
    status: isQuoteStatus(row.status) ? row.status : "DRAFT",
    clientId: row.clientId,
    clientName: `${row.client.contactFirstName} ${row.client.contactLastName}`.trim(),
    clientCompany: row.client.companyName,
    clientEmail: row.client.email,
    clientPhone: row.client.phone,
    clientRut: row.client.rut,
    clientAddress: formatClientAddress(row.client),
    createdByEmail: row.createdByEmail,
    notes: row.notes,
    validUntil: row.validUntil ? row.validUntil.toISOString() : null,
    deliveryBusinessDays: row.deliveryBusinessDays,
    initialPaymentPercent: row.initialPaymentPercent,
    subtotal: decimalToNumber(row.subtotal),
    tax: decimalToNumber(row.tax),
    total: decimalToNumber(row.total),
    sentAt: row.sentAt ? row.sentAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    items,
  };
}

const quoteInclude = {
  client: true,
  items: true,
} as const;

function parseDateFilter(value: string | undefined, endOfDay = false): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function defaultValidUntil(now = new Date()): Date {
  const date = new Date(now);
  date.setDate(date.getDate() + QUOTE_DEFAULT_VALIDITY_DAYS);
  date.setHours(23, 59, 59, 0);
  return date;
}

async function resolveQuoteItems(inputItems: QuoteItemInput[]): Promise<QuoteItemRecord[]> {
  const unique = new Map<string, number>();

  for (const item of inputItems) {
    const planId = String(item.planId ?? "").trim();
    if (!planId) continue;
    const quantity = Math.max(1, Math.trunc(Number(item.quantity) || 1));
    unique.set(planId, (unique.get(planId) ?? 0) + quantity);
  }

  if (unique.size === 0) {
    throw new Error("Selecciona al menos un plan o servicio.");
  }

  const items: QuoteItemRecord[] = [];
  let sortOrder = 0;

  for (const [planId, quantity] of unique.entries()) {
    const plan = await getServicePlanById(planId);

    if (!plan || plan.status !== "ACTIVE") {
      throw new Error("Uno de los planes seleccionados ya no está disponible.");
    }

    const unitPrice = Math.max(0, plan.price);
    const taxRate = Number.isFinite(plan.taxRate) ? plan.taxRate : TAX_RATE;
    const subtotal = unitPrice * quantity;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    items.push({
      id: "",
      planId: plan.id,
      planName: plan.name,
      categoryName: plan.categoryName,
      subcategoryName: plan.subcategoryName,
      quantity,
      unitPrice,
      taxRate,
      includedItems: plan.items.filter((entry) => entry.status === "ACTIVE").map((entry) => entry.label),
      subtotal,
      tax,
      total,
      sortOrder,
    });
    sortOrder += 1;
  }

  return items;
}

export async function listQuotes(filters: QuoteListFilters = {}): Promise<QuoteRecord[]> {
  const query = filters.query?.trim();
  const from = parseDateFilter(filters.from);
  const to = parseDateFilter(filters.to, true);
  const status = filters.status && filters.status !== "ALL" ? filters.status : undefined;

  const rows = await getPrisma().quote.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(filters.clientId ? { clientId: filters.clientId } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
      ...(query
        ? {
            OR: [
              { number: { contains: query } },
              { notes: { contains: query } },
              { client: { companyName: { contains: query } } },
              { client: { email: { contains: query } } },
              { client: { contactFirstName: { contains: query } } },
              { client: { contactLastName: { contains: query } } },
              { client: { rut: { contains: query } } },
            ],
          }
        : {}),
    },
    include: quoteInclude,
    orderBy: { createdAt: "desc" },
  });

  return rows.map(toQuoteRecord);
}

export async function listQuotesByClientId(clientId: string): Promise<QuoteRecord[]> {
  return listQuotes({ clientId });
}

export async function countQuotesByClientId(clientId: string): Promise<number> {
  return getPrisma().quote.count({ where: { clientId } });
}

export async function getQuoteById(id: string): Promise<QuoteRecord | null> {
  const row = await getPrisma().quote.findUnique({
    where: { id },
    include: quoteInclude,
  });

  return row ? toQuoteRecord(row) : null;
}

export async function createQuoteRecord(input: {
  clientId: string;
  items: QuoteItemInput[];
  notes?: string;
  validUntil?: string | null;
  deliveryBusinessDays?: number | string;
  initialPaymentPercent?: number | string;
  status?: QuoteStatus;
  createdByEmail: string;
}): Promise<QuoteRecord> {
  const client = await getClientById(input.clientId);
  if (!client) {
    throw new Error("El cliente no existe.");
  }

  const status = input.status ?? "CREATED";
  if (status !== "DRAFT" && status !== "CREATED") {
    throw new Error("La cotización solo puede guardarse como borrador o creada.");
  }

  const items = await resolveQuoteItems(input.items);
  const totals = {
    subtotal: items.reduce((sum, item) => sum + item.subtotal, 0),
    tax: items.reduce((sum, item) => sum + item.tax, 0),
    total: items.reduce((sum, item) => sum + item.total, 0),
  };

  let validUntil: Date | null = defaultValidUntil();
  if (input.validUntil === null) {
    validUntil = null;
  } else if (input.validUntil) {
    validUntil = parseQuoteValidUntil(input.validUntil);
  }

  const notes = String(input.notes ?? "").trim();
  const createdByEmail = String(input.createdByEmail ?? "").trim().toLowerCase();
  const deliveryBusinessDays =
    input.deliveryBusinessDays == null || input.deliveryBusinessDays === ""
      ? QUOTE_DEFAULT_DELIVERY_DAYS
      : parseDeliveryBusinessDays(input.deliveryBusinessDays);
  const initialPaymentPercent =
    input.initialPaymentPercent == null || input.initialPaymentPercent === ""
      ? QUOTE_DEFAULT_INITIAL_PAYMENT_PERCENT
      : parseInitialPaymentPercent(input.initialPaymentPercent);

  if (!createdByEmail) {
    throw new Error("No se pudo identificar al ejecutivo.");
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const latest = await getPrisma().quote.findFirst({
      where: { number: { startsWith: `COT-${new Date().getFullYear()}-` } },
      orderBy: { number: "desc" },
      select: { number: true },
    });

    const number = nextQuoteNumber(latest?.number);

    try {
      const created = await getPrisma().quote.create({
        data: {
          number,
          status,
          clientId: client.id,
          createdByEmail,
          notes,
          validUntil,
          deliveryBusinessDays,
          initialPaymentPercent,
          subtotal: totals.subtotal,
          tax: totals.tax,
          total: totals.total,
          items: {
            create: items.map((item) => ({
              planId: item.planId,
              planName: item.planName,
              categoryName: item.categoryName,
              subcategoryName: item.subcategoryName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxRate: item.taxRate,
              includedItems: item.includedItems,
              subtotal: item.subtotal,
              tax: item.tax,
              total: item.total,
              sortOrder: item.sortOrder,
            })),
          },
        },
        include: quoteInclude,
      });

      return toQuoteRecord(created);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        attempt < 4
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("No se pudo asignar un número de cotización.");
}

export async function updateQuoteStatus(id: string, status: QuoteStatus): Promise<QuoteRecord> {
  const existing = await getQuoteById(id);
  if (!existing) {
    throw new Error("La cotización no existe.");
  }

  const nextStatus = parseQuoteStatus(status);
  assertQuoteStatusTransition(existing.status, nextStatus);

  const updated = await getPrisma().quote.update({
    where: { id },
    data: { status: nextStatus },
    include: quoteInclude,
  });

  // Conversión automática a venta: cuando este flujo se active, usar
  // convertAcceptedQuoteToSale(id, createdByEmail) desde lib/sales.
  // No registrar pagos en esa conversión.

  return toQuoteRecord(updated);
}

export async function markQuoteSent(id: string): Promise<QuoteRecord> {
  const existing = await getQuoteById(id);
  if (!existing) {
    throw new Error("La cotización no existe.");
  }

  assertQuoteStatusTransition(existing.status, "SENT");

  const updated = await getPrisma().quote.update({
    where: { id },
    data: {
      status: "SENT",
      sentAt: new Date(),
    },
    include: quoteInclude,
  });

  return toQuoteRecord(updated);
}

export function formatQuoteTotals(quote: Pick<QuoteRecord, "subtotal" | "tax" | "total">) {
  return {
    subtotal: formatCurrency(quote.subtotal),
    tax: formatCurrency(quote.tax),
    total: formatCurrency(quote.total),
  };
}
