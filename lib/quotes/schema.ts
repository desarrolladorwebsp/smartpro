import type { PrismaClient } from "@prisma/client";

/**
 * Keeps quote columns added after the initial table creation in sync with the
 * deployed Prisma model. The changes are additive and safe to run repeatedly;
 * this lets production repair older databases on the first quote read.
 */
const ensurePromises = new WeakMap<object, Promise<void>>();

const QUOTE_COLUMN_ADDITIONS = [
  [
    "deliveryBusinessDays",
    "ALTER TABLE `Quote` ADD COLUMN `deliveryBusinessDays` INTEGER NOT NULL DEFAULT 15",
  ],
  [
    "initialPaymentPercent",
    "ALTER TABLE `Quote` ADD COLUMN `initialPaymentPercent` INTEGER NOT NULL DEFAULT 50",
  ],
  [
    "discountType",
    "ALTER TABLE `Quote` ADD COLUMN `discountType` ENUM('NONE', 'PERCENT', 'AMOUNT') NOT NULL DEFAULT 'NONE'",
  ],
  [
    "discountValue",
    "ALTER TABLE `Quote` ADD COLUMN `discountValue` DECIMAL(12, 2) NOT NULL DEFAULT 0",
  ],
  [
    "discountAmount",
    "ALTER TABLE `Quote` ADD COLUMN `discountAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0",
  ],
] as const;

async function quoteColumns(client: PrismaClient): Promise<Set<string>> {
  const columns = (await client.$queryRawUnsafe(`
    SELECT COLUMN_NAME
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Quote'
  `)) as Array<{ COLUMN_NAME: string }>;

  return new Set(columns.map((column) => column.COLUMN_NAME));
}

export async function ensureQuoteSchema(client: PrismaClient): Promise<void> {
  const existing = ensurePromises.get(client);
  if (existing) {
    await existing;
    return;
  }

  const pending = (async () => {
    let columns = await quoteColumns(client);

    for (const [column, sql] of QUOTE_COLUMN_ADDITIONS) {
      if (columns.has(column)) continue;

      try {
        await client.$executeRawUnsafe(sql);
      } catch (error) {
        // Concurrent serverless instances may add the same column. Treat that
        // as success only when a fresh schema read confirms the column exists.
        columns = await quoteColumns(client);
        if (!columns.has(column)) throw error;
      }

      columns.add(column);
    }
  })();

  ensurePromises.set(client, pending);

  try {
    await pending;
  } catch (error) {
    ensurePromises.delete(client);
    throw error;
  }
}
