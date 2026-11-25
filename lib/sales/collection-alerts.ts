import { createHash } from "node:crypto";

import type { AdminSessionRole } from "../auth";
import { calendarToday, parseCalendarDate } from "../calendar-slots";
import { prisma } from "../db";
import type { AdminNotificationRecord } from "../notifications/types";
import { formatCurrency } from "../orders/service";
import type { CalendarCollectionDue } from "./collections";
import { listCollectionDues } from "./collection-repository";

type Session = { email: string; role: AdminSessionRole };
const collectionPrefix = "collection:";

export function collectionAlertDates(now: Date) {
  const today = calendarToday(now);
  const tomorrow = parseCalendarDate(today)!;
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return { today, tomorrow: tomorrow.toISOString().slice(0, 10) };
}

export function collectionAlertsForUser(
  dues: Pick<CalendarCollectionDue, "id" | "dueOn" | "saleId" | "saleNumber" | "clientName" | "remaining" | "executiveId">[],
  session: Session,
  executiveId: string,
  now: Date,
): AdminNotificationRecord[] {
  const { today, tomorrow } = collectionAlertDates(now);
  const createdAt = now.toISOString();
  return dues.flatMap((due) => {
    if (!due.remaining || (due.dueOn !== today && due.dueOn !== tomorrow)) return [];
    if (due.executiveId ? due.executiveId !== executiveId : session.role !== "ADMIN") return [];

    const key = createHash("sha256").update(JSON.stringify([session.email.trim().toLowerCase(), due.id, due.dueOn, today])).digest("hex");
    const id = `${collectionPrefix}${key}`;
    return [{
      id,
      type: "SALE_COLLECTION_DUE" as const,
      title: due.dueOn === today ? "Cobro que vence hoy" : "Cobro que vence mañana",
      body: `${due.clientName} · ${formatCurrency(due.remaining)} pendiente · ${due.saleNumber}`,
      href: `/dashboard/ventas/${encodeURIComponent(due.saleId)}`,
      entityType: "sale",
      entityId: due.saleId,
      dedupeKey: id,
      readAt: null,
      createdAt,
    }];
  });
}

export function isCollectionAlertId(id: string) {
  return id.startsWith(collectionPrefix);
}

export async function listCollectionAlerts(session: Session, now = new Date()) {
  if (!prisma) throw new Error("No hay conexión a la base de datos.");
  const { today, tomorrow } = collectionAlertDates(now);
  const [dues, user] = await Promise.all([
    listCollectionDues(session, { dueOn: [today, tomorrow] }),
    prisma.user.findUnique({ where: { email: session.email.toLowerCase() }, select: { id: true } }),
  ]);
  if (!user) return [];
  const notices = collectionAlertsForUser(dues, session, user.id, now);
  if (!notices.length) return [];
  const reads = await prisma.saleCollectionAlertRead.findMany({ where: { id: { in: notices.map((notice) => notice.id.slice(collectionPrefix.length)) } } });
  const byId = new Map(reads.map((read) => [read.id, read.readAt.toISOString()]));
  return notices.map((notice) => ({ ...notice, readAt: byId.get(notice.id.slice(collectionPrefix.length)) ?? null }));
}

export async function markCollectionAlertsRead(notices: AdminNotificationRecord[]) {
  if (!prisma) throw new Error("No hay conexión a la base de datos.");
  const data = notices.filter((notice) => !notice.readAt).map((notice) => ({ id: notice.id.slice(collectionPrefix.length) }));
  if (!data.length) return 0;
  const { count } = await prisma.saleCollectionAlertRead.createMany({ data, skipDuplicates: true });
  return count;
}
