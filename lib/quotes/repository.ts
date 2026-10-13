import { Prisma } from "@prisma/client";

import { prisma } from "../db";
import { getClientById } from "../clients/repository";
import { notifyQuoteCreated, notifyQuoteSent, notifyQuoteStatusChanged } from "../notifications/events";
import { formatCurrency, TAX_RATE } from "../orders/service";
import { getServicePlanById } from "../services/repository";
import { QUOTE_DEFAULT_DELIVERY_DAYS, QUOTE_DEFAULT_INITIAL_PAYMENT_PERCENT, QUOTE_DEFAULT_VALIDITY_DAYS } from "./company";
import { buildCustomQuoteItemRecord } from "./custom-item";
import { parseQuoteValidUntil } from "./dates";
import { parseDeliveryBusinessDays, parseInitialPaymentPercent } from "./fields";
import { applyQuoteDiscount, parseQuoteDiscount, quoteItemsGross, type QuoteDiscountInput } from "./pricing";
import { createQuoteNumber } from "./numbering";
import { assertQuoteStatusTransition, canEditQuote, nextQuoteStatusAfterEdit, parseQuoteStatus } from "./status";
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
    discountType: row.discountType === "PERCENT" || row.discountType === "AMOUNT" ? row.discountType : "NONE",
    discountValue: decimalToNumber(row.discountValue),
    discountAmount: decimalToNumber(row.discountAmount),
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

function withQuantity(item: QuoteItemRecord, quantity: number): QuoteItemRecord {
  const subtotal = item.unitPrice * quantity;
  const tax = subtotal * item.taxRate;

  return {
    ...item,
    quantity,
    subtotal,
    tax,
    total: subtotal + tax,
  };
}

function snapshotCatalogItem(existing: QuoteItemRecord, quantity: number): QuoteItemRecord {
  return withQuantity(
    {
      ...existing,
      id: "",
    },
    quantity,
  );
}

async function resolveQuoteItems(
  inputItems: QuoteItemInput[],
  existingItems: QuoteItemRecord[] = [],
): Promise<QuoteItemRecord[]> {
  if (inputItems.length === 0) {
    throw new Error("Selecciona al menos un plan o servicio.");
  }

  const items: QuoteItemRecord[] = [];
  const catalogIndex = new Map<string, number>();
  const existingByPlanId = new Map(
    existingItems.filter((item) => item.planId).map((item) => [item.planId as string, item]),
  );

  for (const input of inputItems) {
    if (input.kind === "custom") {
      items.push(buildCustomQuoteItemRecord(input, items.length));
      continue;
    }

    const existingIndex = catalogIndex.get(input.planId);
    if (existingIndex != null) {
      const current = items[existingIndex];
      if (current) {
        items[existingIndex] = withQuantity(current, current.quantity + input.quantity);
      }
      continue;
    }

    const snapshot = existingByPlanId.get(input.planId);
    if (snapshot) {
      catalogIndex.set(input.planId, items.length);
      const priced = input.unitPrice != null ? { ...snapshot, unitPrice: input.unitPrice } : snapshot;
      items.push(snapshotCatalogItem(priced, input.quantity));
      continue;
    }

    const plan = await getServicePlanById(input.planId);
    if (!plan || plan.status !== "ACTIVE") {
      throw new Error("Uno de los planes seleccionados ya no está disponible.");
    }

    const unitPrice = Math.max(0, input.unitPrice ?? plan.price);
    const taxRate = Number.isFinite(plan.taxRate) ? plan.taxRate : TAX_RATE;
    const subtotal = unitPrice * input.quantity;
    const tax = subtotal * taxRate;

    catalogIndex.set(input.planId, items.length);
    items.push({
      id: "",
      planId: plan.id,
      planName: plan.name,
      categoryName: plan.categoryName,
      subcategoryName: plan.subcategoryName,
      quantity: input.quantity,
      unitPrice,
      taxRate,
      includedItems: plan.items.filter((entry) => entry.status === "ACTIVE").map((entry) => entry.label),
      subtotal,
      tax,
      total: subtotal + tax,
      sortOrder: items.length,
    });
  }

  return items.map((item, sortOrder) => ({ ...item, sortOrder }));
}

function pricedQuoteTotals(items: QuoteItemRecord[], discount?: QuoteDiscountInput) {
  return applyQuoteDiscount(quoteItemsGross(items), discount ?? { type: "NONE", value: 0 });
}

function quoteItemCreateData(items: QuoteItemRecord[]) {
  return items.map((item) => ({
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
  }));
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
  discount?: QuoteDiscountInput;
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
  const discount = parseQuoteDiscount(input.discount);
  const totals = pricedQuoteTotals(items, discount);

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
    const number = createQuoteNumber();

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
          discountType: totals.discountType,
          discountValue: totals.discountValue,
          discountAmount: totals.discountAmount,
          subtotal: totals.subtotal,
          tax: totals.tax,
          total: totals.total,
          items: {
            create: quoteItemCreateData(items),
          },
        },
        include: quoteInclude,
      });

      const record = toQuoteRecord(created);
      await notifyQuoteCreated(record);
      return record;
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

export async function updateQuoteRecord(
  id: string,
  input: {
    items: QuoteItemInput[];
    notes?: string;
    validUntil?: string | null;
    deliveryBusinessDays?: number | string;
    initialPaymentPercent?: number | string;
    discount?: QuoteDiscountInput;
    status?: QuoteStatus;
  },
): Promise<QuoteRecord> {
  const existing = await getQuoteById(id);
  if (!existing) {
    throw new Error("La cotización no existe.");
  }

  if (!canEditQuote(existing.status)) {
    throw new Error("Esta cotización ya no se puede modificar.");
  }

  const sale = await getPrisma().sale.findUnique({
    where: { quoteId: existing.id },
    select: { id: true },
  });
  if (sale) {
    throw new Error("No se puede modificar una cotización convertida en venta.");
  }

  const status = nextQuoteStatusAfterEdit(existing.status, input.status);
  const items = await resolveQuoteItems(input.items, existing.items);
  const discount = parseQuoteDiscount(
    input.discount ?? { type: existing.discountType, value: existing.discountValue },
  );
  const totals = pricedQuoteTotals(items, discount);

  let validUntil: Date | null = existing.validUntil ? new Date(existing.validUntil) : null;
  if (input.validUntil === null) {
    validUntil = null;
  } else if (input.validUntil) {
    validUntil = parseQuoteValidUntil(input.validUntil);
  }

  const notes = String(input.notes ?? existing.notes).trim();
  const deliveryBusinessDays =
    input.deliveryBusinessDays == null || input.deliveryBusinessDays === ""
      ? existing.deliveryBusinessDays
      : parseDeliveryBusinessDays(input.deliveryBusinessDays);
  const initialPaymentPercent =
    input.initialPaymentPercent == null || input.initialPaymentPercent === ""
      ? existing.initialPaymentPercent
      : parseInitialPaymentPercent(input.initialPaymentPercent);

  const updated = await getPrisma().$transaction(async (tx) => {
    await tx.quoteItem.deleteMany({ where: { quoteId: existing.id } });

    return tx.quote.update({
      where: { id: existing.id },
      data: {
        status,
        notes,
        validUntil,
        deliveryBusinessDays,
        initialPaymentPercent,
        discountType: totals.discountType,
        discountValue: totals.discountValue,
        discountAmount: totals.discountAmount,
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
        sentAt: status === "SENT" ? existing.sentAt : null,
        items: {
          create: quoteItemCreateData(items),
        },
      },
      include: quoteInclude,
    });
  });

  return toQuoteRecord(updated);
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

  const record = toQuoteRecord(updated);
  await notifyQuoteStatusChanged(record);
  return record;
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

  const record = toQuoteRecord(updated);
  await notifyQuoteSent(record);
  return record;
}

export function formatQuoteTotals(quote: Pick<QuoteRecord, "subtotal" | "tax" | "total">) {
  return {
    subtotal: formatCurrency(quote.subtotal),
    tax: formatCurrency(quote.tax),
    total: formatCurrency(quote.total),
  };
}
