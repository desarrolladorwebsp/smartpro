import type { AdminNotification, AdminNotificationType as PrismaAdminNotificationType, Prisma } from "@prisma/client";

import { getPrismaClient } from "../db";
import { withAdminNotificationTable } from "./schema";
import {
  isAdminNotificationType,
  type AdminNotificationDraft,
  type AdminNotificationRecord,
  type AdminNotificationType,
} from "./types";

function getPrisma() {
  const client = getPrismaClient();
  if (!client) {
    throw new Error("No hay conexión a la base de datos.");
  }
  return client;
}

function toRecord(row: AdminNotification): AdminNotificationRecord {
  return {
    id: row.id,
    type: isAdminNotificationType(row.type) ? row.type : "CLIENT_CREATED",
    title: row.title,
    body: row.body,
    href: row.href,
    entityType: row.entityType,
    entityId: row.entityId,
    dedupeKey: row.dedupeKey,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export type ListAdminNotificationsOptions = {
  unreadOnly?: boolean;
  type?: AdminNotificationType | "ALL";
  query?: string;
  limit?: number;
};

export async function listAdminNotifications(
  options: ListAdminNotificationsOptions = {},
): Promise<AdminNotificationRecord[]> {
  return withAdminNotificationTable(async () => {
    const where: Prisma.AdminNotificationWhereInput = {};

    if (options.unreadOnly) {
      where.readAt = null;
    }

    if (options.type && options.type !== "ALL") {
      where.type = options.type as PrismaAdminNotificationType;
    }

    const query = options.query?.trim();
    if (query) {
      where.OR = [
        { title: { contains: query } },
        { body: { contains: query } },
      ];
    }

    const rows = await getPrisma().adminNotification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(options.limit ?? 200, 1), 500),
    });

    return rows.map(toRecord);
  });
}

export async function countUnreadAdminNotifications(): Promise<number> {
  return withAdminNotificationTable(async () => {
    return getPrisma().adminNotification.count({ where: { readAt: null } });
  });
}

export async function createAdminNotification(
  draft: AdminNotificationDraft,
): Promise<AdminNotificationRecord | null> {
  return withAdminNotificationTable(async () => {
    const created = await getPrisma().adminNotification.upsert({
      where: { dedupeKey: draft.dedupeKey },
      create: {
        type: draft.type as PrismaAdminNotificationType,
        title: draft.title,
        body: draft.body,
        href: draft.href,
        entityType: draft.entityType,
        entityId: draft.entityId,
        dedupeKey: draft.dedupeKey,
      },
      update: {},
    });

    return toRecord(created);
  });
}

export async function markAdminNotificationRead(id: string): Promise<AdminNotificationRecord | null> {
  return withAdminNotificationTable(async () => {
    const existing = await getPrisma().adminNotification.findUnique({ where: { id } });
    if (!existing) return null;

    if (existing.readAt) {
      return toRecord(existing);
    }

    const updated = await getPrisma().adminNotification.update({
      where: { id },
      data: { readAt: new Date() },
    });

    return toRecord(updated);
  });
}

export async function markAllAdminNotificationsRead(): Promise<number> {
  return withAdminNotificationTable(async () => {
    const result = await getPrisma().adminNotification.updateMany({
      where: { readAt: null },
      data: { readAt: new Date() },
    });
    return result.count;
  });
}
