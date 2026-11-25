import type { Prisma } from "@prisma/client";

import type { AdminSessionRole } from "../auth";
import { calendarToday, parseCalendarDate } from "../calendar-slots";
import { parseBusinessRecipient } from "../clients/business";
import { commercialClientId, parseContactSnapshot } from "../clients/commercial-clients";
import { prisma } from "../db";
import { getBalanceDue, roundClp, sumPaidAmount } from "./balances";
import {
  allocateCollectionDues,
  buildCollectionPreview,
  collectionInstallmentAmounts,
  type CalendarCollectionDue,
  type CollectionMode,
  type SaleCollection,
  type SaleCollectionSummary,
} from "./collections";

type CollectionSession = { email: string; role: AdminSessionRole };

const staffSelect = { id: true, email: true, firstName: true, lastName: true, status: true, deletedAt: true, role: true } as const;
const businessSelect = { id: true, name: true, deletedAt: true, responsible: { select: staffSelect } } as const;
const collectionSelect = {
  id: true,
  number: true,
  clientId: true,
  businessId: true,
  businessRecipient: true,
  contactSnapshot: true,
  executive: { select: staffSelect },
  business: { select: businessSelect },
  client: {
    select: {
      companyName: true, contactFirstName: true, contactLastName: true, deletedAt: true,
      assignedExecutive: { select: staffSelect }, business: { select: businessSelect },
    },
  },
  total: true,
  payments: { select: { amount: true } },
  collectionDues: { select: { id: true, sequence: true, dueOn: true, amount: true }, orderBy: { sequence: "asc" } },
} as const satisfies Prisma.SaleSelect;
const scheduleSelect = {
  ...collectionSelect,
  quote: { select: { proposal: true } },
  liorenInvoiceStatus: true,
  liorenInvoiceDraft: true,
} as const satisfies Prisma.SaleSelect;

type CollectionSaleRow = Prisma.SaleGetPayload<{ select: typeof collectionSelect }>;
type ScheduleSaleRow = Prisma.SaleGetPayload<{ select: typeof scheduleSelect }>;

export class CollectionRequestError extends Error {
  constructor(message: string, readonly status: 400 | 404 | 409) {
    super(message);
  }
}

function db() {
  if (!prisma) throw new Error("No hay conexión a la base de datos.");
  return prisma;
}

function activeSaleFilter(session: CollectionSession): Prisma.SaleWhereInput {
  const filter: Prisma.SaleWhereInput = {
    archivedAt: null,
    status: { not: "CANCELLED" },
    client: { deletedAt: null },
    // A legacy sale may still be linked to a company through its contact.
    AND: [{ OR: [
      { business: { is: { deletedAt: null } } },
      { businessId: null, client: { OR: [{ businessId: null }, { business: { is: { deletedAt: null } } }] } },
    ] }],
  };
  if (session.role === "EXECUTIVE") {
    const staff = { email: session.email, role: "EXECUTIVE", status: "ACTIVE", deletedAt: null } as const;
    filter.OR = [
      { executive: { is: staff } },
      { business: { is: { responsible: { is: staff } } } },
      { client: { assignedExecutive: { is: staff } } },
      { client: { business: { is: { responsible: { is: staff } } } } },
    ];
  }
  return filter;
}

function currentExecutive(row: CollectionSaleRow) {
  return [row.executive, (row.business ?? row.client.business)?.responsible, row.client.assignedExecutive].find(
    (staff) => staff && !staff.deletedAt && staff.status === "ACTIVE" && (staff.role === "ADMIN" || staff.role === "EXECUTIVE"),
  ) ?? null;
}

function canViewSale(row: CollectionSaleRow, session: CollectionSession) {
  return session.role === "ADMIN" || currentExecutive(row)?.email.toLowerCase() === session.email.toLowerCase();
}

function getClientName(row: CollectionSaleRow) {
  const contact = parseContactSnapshot(row.contactSnapshot);
  const businessName = (row.business ?? row.client.business)?.name ?? parseBusinessRecipient(row.businessRecipient)?.name;
  return businessName || contact?.legacyCompanyName || row.client.companyName ||
    contact?.name || `${row.client.contactFirstName} ${row.client.contactLastName}`.trim() || "Cliente";
}

function paidAmount(row: CollectionSaleRow) {
  return sumPaidAmount(row.payments.map(({ amount }) => ({ amount: Number(amount) })));
}

function readDues(row: CollectionSaleRow, today: string, paid = paidAmount(row)) {
  return allocateCollectionDues(row.collectionDues.map((due) => ({
    ...due, dueOn: due.dueOn.toISOString().slice(0, 10), amount: Number(due.amount),
  })), paid, today);
}

function invoiceDueOn(row: ScheduleSaleRow): string | null {
  if (row.liorenInvoiceStatus !== "ISSUED" || !row.liorenInvoiceDraft) return null;
  try {
    const parsed: unknown = JSON.parse(row.liorenInvoiceDraft);
    const value = (parsed as { vencimiento?: unknown } | null)?.vencimiento;
    return parseCalendarDate(value) ? String(value) : null;
  } catch {
    return null;
  }
}

function saleCollection(row: ScheduleSaleRow, today: string): SaleCollection {
  const paid = paidAmount(row);
  const total = Number(row.total);
  const balanceDue = getBalanceDue(total, paid);
  const installmentAmounts = collectionInstallmentAmounts(row.quote?.proposal, total);
  const installments = readDues(row, today, paid);
  return {
    saleId: row.id, saleNumber: row.number, clientName: getClientName(row), balanceDue, paidAmount: paid,
    canSchedule: balanceDue > 0, hasInstallments: installmentAmounts.length > 0, installmentAmounts,
    suggestedDate: invoiceDueOn(row), firstDueOn: installments[0]?.dueOn ?? null,
    mode: installments.length === 0 ? null : installments.length === 1 ? "SINGLE" : "INSTALLMENTS",
    installments,
  };
}

export async function getSaleCollection(saleId: string, session: CollectionSession): Promise<SaleCollection | null> {
  const row = await db().sale.findFirst({ where: { id: saleId, ...activeSaleFilter(session) }, select: scheduleSelect });
  return row && canViewSale(row, session) ? saleCollection(row, calendarToday()) : null;
}

export async function saveSaleCollection(
  saleId: string,
  session: CollectionSession,
  input: { firstDueOn?: unknown; mode?: unknown },
): Promise<SaleCollection> {
  const firstDueOn = parseCalendarDate(input.firstDueOn);
  if (!firstDueOn) throw new CollectionRequestError("Ingresa una fecha válida para el primer vencimiento.", 400);
  if (input.mode !== "SINGLE" && input.mode !== "INSTALLMENTS") throw new CollectionRequestError("Selecciona cómo pagará el cliente.", 400);
  const mode: CollectionMode = input.mode;
  return db().$transaction(async (tx) => {
    // Serializes schedule changes for a sale and makes retries converge on one schedule.
    await tx.$queryRaw`SELECT id FROM \`Sale\` WHERE id = ${saleId} FOR UPDATE`;
    const row = await tx.sale.findFirst({ where: { id: saleId, ...activeSaleFilter(session) }, select: scheduleSelect });
    if (!row || !canViewSale(row, session)) throw new CollectionRequestError("La venta no está disponible para programar cobros.", 404);
    const today = calendarToday();
    const current = saleCollection(row, today);
    if (!current.canSchedule) throw new CollectionRequestError("La venta ya está pagada.", 409);
    if (mode === "INSTALLMENTS" && !current.hasInstallments) {
      throw new CollectionRequestError("La venta no tiene cuotas que se puedan programar.", 400);
    }

    const amounts = mode === "SINGLE" ? [roundClp(Number(row.total))] : current.installmentAmounts;
    let next: SaleCollection["installments"];
    try {
      next = buildCollectionPreview(firstDueOn.toISOString().slice(0, 10), amounts, current.paidAmount, today)
        .map((due) => ({ ...due, id: `${row.id}-${due.sequence}` }));
    } catch (error) {
      throw new CollectionRequestError(error instanceof Error ? error.message : "Revisa las fechas y montos de cobro.", 400);
    }
    if (next.length === current.installments.length && next.every(({ dueOn, amount }, index) => {
      const due = current.installments[index];
      return due.dueOn === dueOn && due.amount === amount;
    })) return current;

    await tx.saleCollectionDue.deleteMany({ where: { saleId } });
    await tx.saleCollectionDue.createMany({ data: next.map((due) => ({
      id: due.id, saleId, sequence: due.sequence, dueOn: new Date(`${due.dueOn}T00:00:00Z`), amount: due.amount,
    })) });
    return { ...current, firstDueOn: next[0].dueOn, mode, installments: next };
  });
}

export async function listSaleCollectionSummaries(session: CollectionSession): Promise<Record<string, SaleCollectionSummary>> {
  const rows = await db().sale.findMany({ where: activeSaleFilter(session), select: collectionSelect });
  const today = calendarToday();
  return Object.fromEntries(rows.flatMap((row) => canViewSale(row, session) && getBalanceDue(Number(row.total), paidAmount(row)) > 0
    ? [[row.id, { nextDue: readDues(row, today).find(({ remaining }) => remaining > 0) ?? null }]]
    : []));
}

export async function listCollectionDues(session: CollectionSession, options?: { dueOn?: string[] }): Promise<CalendarCollectionDue[]> {
  const dates = options?.dueOn;
  if (dates?.length === 0) return [];
  const dateScope = dates ? new Set(dates) : null;
  const rows = await db().sale.findMany({
    where: {
      ...activeSaleFilter(session),
      collectionDues: { some: dateScope ? { dueOn: { in: Array.from(dateScope, (date) => new Date(`${date}T00:00:00Z`)) } } : {} },
    },
    select: collectionSelect,
  });
  const today = calendarToday();
  return rows.flatMap((row) => {
    if (!canViewSale(row, session)) return [];
    const executive = currentExecutive(row);
    const clientName = getClientName(row);
    const clientKey = commercialClientId(row.clientId, row.businessId ?? row.client.business?.id);
    const executiveName = executive ? `${executive.firstName} ${executive.lastName ?? ""}`.trim() || executive.email : null;
    return readDues(row, today).flatMap((due) => due.remaining > 0 && (!dateScope || dateScope.has(due.dueOn)) ? [{
      ...due,
      saleId: row.id, saleNumber: row.number, clientName, clientKey, executiveId: executive?.id ?? null, executiveName,
    }] : []);
  }).sort((a, b) => a.dueOn.localeCompare(b.dueOn) || a.saleNumber.localeCompare(b.saleNumber) || a.sequence - b.sequence);
}
