import { Prisma } from "@prisma/client";

import { prisma } from "../db";
import { getAgencySnapshot } from "../agencies/repository";
import { ensureAgencySchema } from "../agencies/schema";
import { getSmartProFallback, parseAgencyIdentity, SMARTPRO_AGENCY_ID } from "../agencies/types";
import { resolveCommercialRecipient } from "../clients/commercial-recipient";
import { advanceCrmForQuote } from "../clients/quote-crm";
import { parseContactSnapshot, personName } from "../clients/commercial-clients";
import { parseBusinessRecipient } from "../clients/business";
import { notifyQuoteCreated, notifyQuoteSent, notifyQuoteStatusChanged } from "../notifications/events";
import { formatCurrency, TAX_RATE } from "../orders/service";
import { getServicePlanById } from "../services/repository";
import { QUOTE_DEFAULT_DELIVERY_DAYS, QUOTE_DEFAULT_INITIAL_PAYMENT_PERCENT, QUOTE_DEFAULT_VALIDITY_DAYS } from "./company";
import { buildCustomQuoteItemRecord } from "./custom-item";
import { parseQuoteValidUntil } from "./dates";
import { parseDeliveryBusinessDays, parseInitialPaymentPercent } from "./fields";
import { applyQuoteDiscount, parseQuoteDiscount, quoteItemsGross, type QuoteDiscountInput } from "./pricing";
import { buildQuoteProposal, type QuoteProposal } from "./proposal";
import { ensureQuoteSchema } from "./schema";
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
  const businessRecipient = parseBusinessRecipient(row.businessRecipient);
  const contactSnapshot = parseContactSnapshot(row.contactSnapshot);
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
    businessId: row.businessId,
    contactId: row.contactId,
    contactSnapshot,
    clientName: contactSnapshot?.name ?? `${row.client.contactFirstName} ${row.client.contactLastName}`.trim(),
    businessRecipient,
    clientCompany: businessRecipient?.name ?? (contactSnapshot ? contactSnapshot.legacyCompanyName ?? "" : row.client.companyName),
    clientEmail: contactSnapshot?.email ?? row.client.email,
    clientPhone: contactSnapshot?.phone ?? row.client.phone,
    clientRut: businessRecipient?.rut ?? contactSnapshot?.rut ?? row.client.rut,
    clientAddress: businessRecipient?.address ?? contactSnapshot?.address ?? formatClientAddress(row.client),
    agencyId: row.agencyId || SMARTPRO_AGENCY_ID,
    agency: parseAgencyIdentity(row.agencySnapshot, getSmartProFallback()),
    createdByEmail: row.createdByEmail,
    notes: row.notes,
    proposal: row.proposal as QuoteProposal | null,
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
  const prisma = getPrisma();
  await ensureQuoteSchema(prisma);
  await ensureAgencySchema(prisma);

  const query = filters.query?.trim();
  const from = parseDateFilter(filters.from);
  const to = parseDateFilter(filters.to, true);
  const status = filters.status && filters.status !== "ALL" ? filters.status : undefined;

  const rows = await prisma.quote.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(filters.clientId ? { clientId: filters.clientId } : {}),
      ...(filters.businessId ? { businessId: filters.businessId } : filters.individualOnly ? { businessId: null } : {}),
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
              { business: { name: { contains: query } } },
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
  await ensureQuoteSchema(getPrisma());
  await ensureAgencySchema(getPrisma());
  const row = await getPrisma().quote.findUnique({
    where: { id },
    include: quoteInclude,
  });

  return row ? toQuoteRecord(row) : null;
}

function validateVisibleFields(
  input: { deliveryBusinessDays?: number | string; initialPaymentPercent?: number | string },
  proposal?: QuoteProposal,
) {
  if (proposal?.showDelivery) parseDeliveryBusinessDays(input.deliveryBusinessDays);
  if (proposal?.showDeposit) parseInitialPaymentPercent(input.initialPaymentPercent);
}

export async function createQuoteRecord(input: {
  clientId: string;
  accountId?: string;
  agencyId?: string;
  items: QuoteItemInput[];
  notes?: string;
  proposal?: unknown;
  validUntil?: string | null;
  deliveryBusinessDays?: number | string;
  initialPaymentPercent?: number | string;
  discount?: QuoteDiscountInput;
  status?: QuoteStatus;
  createdByEmail: string;
}): Promise<QuoteRecord> {
  const prisma = getPrisma();
  await ensureQuoteSchema(prisma);
  const agency = await getAgencySnapshot(input.agencyId || SMARTPRO_AGENCY_ID);
  const { client, business: businessRecipient, contactSnapshot } = await resolveCommercialRecipient(input.clientId, input.accountId);
  const status = input.status ?? "CREATED";
  if (status !== "DRAFT" && status !== "CREATED") {
    throw new Error("La cotización solo puede guardarse como borrador o creada.");
  }

  const items = await resolveQuoteItems(input.items);
  const discount = parseQuoteDiscount(input.discount);
  const totals = pricedQuoteTotals(items, discount);
  const proposal = input.proposal === undefined
    ? undefined
    : buildQuoteProposal(input.proposal, items.map((item) => item.total), totals.total);


  let validUntil: Date | null = defaultValidUntil();
  if (proposal?.showExpiration === false || input.validUntil === null) {
    validUntil = null;
  } else if (input.validUntil) {
    validUntil = parseQuoteValidUntil(input.validUntil);
  }

  if (proposal?.showExpiration && !validUntil) {
    throw new Error("Ingresa la fecha de vencimiento o desactiva esa opción.");
  }

  const notes = String(input.notes ?? "").trim();
  const createdByEmail = String(input.createdByEmail ?? "").trim().toLowerCase();
  const deliveryBusinessDays =
    proposal?.showDelivery === false || input.deliveryBusinessDays == null || input.deliveryBusinessDays === ""
      ? QUOTE_DEFAULT_DELIVERY_DAYS
      : parseDeliveryBusinessDays(input.deliveryBusinessDays);
  const initialPaymentPercent =
    proposal?.showDeposit === false || input.initialPaymentPercent == null || input.initialPaymentPercent === ""
      ? QUOTE_DEFAULT_INITIAL_PAYMENT_PERCENT
      : parseInitialPaymentPercent(input.initialPaymentPercent);

  validateVisibleFields(input, proposal);

  if (!createdByEmail) {
    throw new Error("No se pudo identificar al ejecutivo.");
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const number = createQuoteNumber();

    try {
      const created = await prisma.$transaction(async (tx) => {
        const quote = await tx.quote.create({
          data: {
            number,
            status,
            clientId: client.id,
            contactId: client.contactId,
            businessRecipient: businessRecipient ?? undefined,
            businessId: businessRecipient?.id,
            contactSnapshot,
            agencyId: agency.id,
            agencySnapshot: agency,
            createdByEmail,
            notes,
            proposal,
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
        if (status === "CREATED") await advanceCrmForQuote(tx, quote, "FINALIZED", createdByEmail);
        return quote;
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
    proposal?: unknown;
    validUntil?: string | null;
    deliveryBusinessDays?: number | string;
    initialPaymentPercent?: number | string;
    discount?: QuoteDiscountInput;
    status?: QuoteStatus;
    actorEmail?: string;
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

  if (existing.proposal && input.proposal === undefined) {
    throw new Error("Incluye la configuración de los pagos al editar esta cotización.");
  }

  const status = nextQuoteStatusAfterEdit(existing.status, input.status);
  const items = await resolveQuoteItems(input.items, existing.items);
  const discount = parseQuoteDiscount(
    input.discount ?? { type: existing.discountType, value: existing.discountValue },
  );
  const totals = pricedQuoteTotals(items, discount);
  const proposal = input.proposal === undefined
    ? undefined
    : buildQuoteProposal(input.proposal, items.map((item) => item.total), totals.total);


  let validUntil: Date | null = existing.validUntil ? new Date(existing.validUntil) : null;
  if (proposal?.showExpiration === false || input.validUntil === null) {
    validUntil = null;
  } else if (input.validUntil) {
    validUntil = parseQuoteValidUntil(input.validUntil);
  }

  if (proposal?.showExpiration && !validUntil) {
    throw new Error("Ingresa la fecha de vencimiento o desactiva esa opción.");
  }

  const notes = String(input.notes ?? existing.notes).trim();
  const deliveryBusinessDays =
    proposal?.showDelivery === false || input.deliveryBusinessDays == null || input.deliveryBusinessDays === ""
      ? existing.deliveryBusinessDays
      : parseDeliveryBusinessDays(input.deliveryBusinessDays);
  const initialPaymentPercent =
    proposal?.showDeposit === false || input.initialPaymentPercent == null || input.initialPaymentPercent === ""
      ? existing.initialPaymentPercent
      : parseInitialPaymentPercent(input.initialPaymentPercent);

  validateVisibleFields(input, proposal);

  const updated = await getPrisma().$transaction(async (tx) => {
    const contact = existing.status === "DRAFT"
      ? await tx.client.findUnique({ where: { id: existing.clientId } })
      : null;
    const contactSnapshot = contact && contact.businessId === (existing.businessId ?? null) ? {
      ...(existing.contactSnapshot ?? {
        rut: existing.clientRut,
        address: existing.clientAddress,
        legacyCompanyName: existing.clientCompany,
      }),
      name: personName(contact),
      email: contact.email,
      phone: contact.phone,
    } : undefined;
    await tx.quoteItem.deleteMany({ where: { quoteId: existing.id } });

    const quote = await tx.quote.update({
      where: { id: existing.id, status: existing.status, updatedAt: new Date(existing.updatedAt) },
      data: {
        status,
        notes,
        proposal,
        contactSnapshot,
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
    if (existing.status === "DRAFT" && status === "CREATED") {
      await advanceCrmForQuote(tx, quote, "FINALIZED", input.actorEmail ?? quote.createdByEmail);
    }
    return quote;
  });

  return toQuoteRecord(updated);
}

export async function updateQuoteStatus(id: string, status: QuoteStatus, actorEmail?: string): Promise<QuoteRecord> {
  const existing = await getQuoteById(id);
  if (!existing) {
    throw new Error("La cotización no existe.");
  }

  const nextStatus = parseQuoteStatus(status);
  assertQuoteStatusTransition(existing.status, nextStatus);

  const updated = await getPrisma().$transaction(async (tx) => {
    const quote = await tx.quote.update({
      where: { id, status: existing.status },
      data: { status: nextStatus },
      include: quoteInclude,
    });
    if (existing.status !== nextStatus && (nextStatus === "CREATED" || nextStatus === "ACCEPTED")) {
      await advanceCrmForQuote(tx, quote, nextStatus === "ACCEPTED" ? "ACCEPTED" : "FINALIZED", actorEmail ?? quote.createdByEmail);
    }
    return quote;
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

  const updated = await getPrisma().$transaction(async (tx) => {
    const quote = await tx.quote.update({
      where: { id, status: existing.status },
      data: { status: "SENT", sentAt: new Date() },
      include: quoteInclude,
    });
    if (existing.status === "DRAFT") await advanceCrmForQuote(tx, quote, "FINALIZED", quote.createdByEmail);
    return quote;
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
