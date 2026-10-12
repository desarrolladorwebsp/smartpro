import type { PrismaClient } from "@prisma/client";

import { getPrismaClient } from "../db";

const CREATE_ADMIN_NOTIFICATION_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS \`AdminNotification\` (
    \`id\` VARCHAR(191) NOT NULL,
    \`type\` ENUM(
      'CLIENT_CREATED',
      'QUOTE_CREATED',
      'QUOTE_SENT',
      'QUOTE_ACCEPTED',
      'QUOTE_REJECTED',
      'ORDER_CREATED',
      'ORDER_PAID',
      'SALE_REGISTERED',
      'PAYMENT_RECEIVED'
    ) NOT NULL,
    \`title\` VARCHAR(191) NOT NULL,
    \`body\` TEXT NOT NULL,
    \`href\` VARCHAR(191) NOT NULL DEFAULT '',
    \`entityType\` VARCHAR(191) NOT NULL DEFAULT '',
    \`entityId\` VARCHAR(191) NOT NULL DEFAULT '',
    \`dedupeKey\` VARCHAR(191) NOT NULL,
    \`readAt\` DATETIME(3) NULL,
    \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (\`id\`),
    UNIQUE INDEX \`AdminNotification_dedupeKey_key\` (\`dedupeKey\`),
    INDEX \`AdminNotification_createdAt_idx\` (\`createdAt\`),
    INDEX \`AdminNotification_readAt_idx\` (\`readAt\`),
    INDEX \`AdminNotification_type_idx\` (\`type\`)
  ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
`;

const ensurePromises = new WeakMap<object, Promise<void>>();

export function isMissingAdminNotificationTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? String((error as { code?: string }).code ?? "") : "";
  const message = error instanceof Error ? error.message : String(error);

  return (
    code === "P2021" ||
    code === "P2022" ||
    /table `?[^`]*AdminNotification`? does not exist/i.test(message) ||
    /unknown table ['`]AdminNotification['`]/i.test(message) ||
    /AdminNotification['`]? does(?:n't| not) exist/i.test(message)
  );
}

async function tableExists(prisma: PrismaClient, table: string) {
  const rows = (await prisma.$queryRawUnsafe("SHOW TABLES")) as Array<Record<string, string>>;
  return rows.some((row) => Object.values(row)[0] === table);
}

async function ensureNotificationTypeValues(prisma: PrismaClient) {
  const columns = (await prisma.$queryRawUnsafe(
    "SHOW COLUMNS FROM `AdminNotification` LIKE 'type'",
  )) as Array<Record<string, string>>;
  const typeColumn = columns[0];
  const columnType = typeColumn
    ? String(typeColumn.Type ?? typeColumn.type ?? Object.values(typeColumn)[1] ?? "")
    : "";

  if (!columnType.includes("ORDER_CREATED")) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`AdminNotification\` MODIFY COLUMN \`type\` ENUM(
        'CLIENT_CREATED', 'QUOTE_CREATED', 'QUOTE_SENT', 'QUOTE_ACCEPTED',
        'QUOTE_REJECTED', 'ORDER_CREATED', 'ORDER_PAID', 'SALE_REGISTERED',
        'PAYMENT_RECEIVED'
      ) NOT NULL
    `);
  }
}

export async function ensureAdminNotificationTable(client?: PrismaClient | null): Promise<void> {
  const prisma = client ?? getPrismaClient();

  if (!prisma) {
    throw new Error("No hay conexión a la base de datos.");
  }

  const existing = ensurePromises.get(prisma);
  if (existing) {
    await existing;
    return;
  }

  const pending = (async () => {
    if (!(await tableExists(prisma, "AdminNotification"))) {
      await prisma.$executeRawUnsafe(CREATE_ADMIN_NOTIFICATION_TABLE_SQL);
    } else {
      await ensureNotificationTypeValues(prisma);
    }
  })();

  ensurePromises.set(prisma, pending);

  try {
    await pending;
  } catch (error) {
    ensurePromises.delete(prisma);
    throw error;
  }
}

export async function withAdminNotificationTable<T>(
  operation: () => Promise<T>,
  client?: PrismaClient | null,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!isMissingAdminNotificationTableError(error)) {
      throw error;
    }

    await ensureAdminNotificationTable(client);
    return operation();
  }
}
