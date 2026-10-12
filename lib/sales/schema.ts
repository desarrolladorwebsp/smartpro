import type { PrismaClient } from "@prisma/client";

import { getPrismaClient } from "../db";

const CREATE_SALE_PAYMENT_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS \`SalePayment\` (
    \`id\` VARCHAR(191) NOT NULL,
    \`saleId\` VARCHAR(191) NOT NULL,
    \`amount\` DECIMAL(12, 2) NOT NULL,
    \`method\` ENUM('simulated', 'transbank', 'mercadopago', 'transfer', 'cash', 'other') NOT NULL,
    \`paidAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    \`receiptPath\` VARCHAR(191) NOT NULL DEFAULT '',
    \`receiptFileName\` VARCHAR(191) NOT NULL DEFAULT '',
    \`orderId\` VARCHAR(191) NULL,
    \`source\` ENUM('ORDER_PAID', 'MANUAL', 'EXTERNAL_API') NOT NULL DEFAULT 'MANUAL',
    \`createdByEmail\` VARCHAR(191) NOT NULL,
    \`observation\` TEXT NOT NULL,
    \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (\`id\`),
    UNIQUE INDEX \`SalePayment_orderId_key\` (\`orderId\`),
    INDEX \`SalePayment_saleId_idx\` (\`saleId\`),
    INDEX \`SalePayment_paidAt_idx\` (\`paidAt\`)
  ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
`;

const ensurePromises = new WeakMap<object, Promise<void>>();

export function isMissingSalePaymentTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? String((error as { code?: string }).code ?? "") : "";
  const message = error instanceof Error ? error.message : String(error);

  return (
    code === "P2021" ||
    code === "P2022" ||
    /table `?[^`]*SalePayment`? does not exist/i.test(message) ||
    /unknown table ['`]SalePayment['`]/i.test(message) ||
    /SalePayment['`]? does(?:n't| not) exist/i.test(message)
  );
}

async function tableExists(prisma: PrismaClient, table: string) {
  const rows = (await prisma.$queryRawUnsafe("SHOW TABLES")) as Array<Record<string, string>>;
  return rows.some((row) => Object.values(row)[0] === table);
}

async function foreignKeyExists(prisma: PrismaClient, table: string, constraint: string) {
  const rows = (await prisma.$queryRawUnsafe(`
    SELECT CONSTRAINT_NAME
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = '${table}'
      AND CONSTRAINT_NAME = '${constraint}'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
  `)) as Array<{ CONSTRAINT_NAME: string }>;
  return rows.length > 0;
}

async function addForeignKey(prisma: PrismaClient, table: string, constraint: string, sql: string) {
  if (await foreignKeyExists(prisma, table, constraint)) {
    return;
  }

  try {
    await prisma.$executeRawUnsafe(sql);
  } catch (error) {
    if (!(await foreignKeyExists(prisma, table, constraint))) {
      throw error;
    }
  }
}

export async function ensureSalePaymentTable(client?: PrismaClient | null): Promise<void> {
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
    if (!(await tableExists(prisma, "Sale"))) {
      throw new Error("Se requiere la tabla Sale antes de crear SalePayment.");
    }

    if (!(await tableExists(prisma, "SalePayment"))) {
      await prisma.$executeRawUnsafe(CREATE_SALE_PAYMENT_TABLE_SQL);
    }

    await addForeignKey(
      prisma,
      "SalePayment",
      "SalePayment_saleId_fkey",
      `ALTER TABLE \`SalePayment\`
        ADD CONSTRAINT \`SalePayment_saleId_fkey\`
        FOREIGN KEY (\`saleId\`) REFERENCES \`Sale\`(\`id\`)
        ON DELETE CASCADE ON UPDATE CASCADE`,
    );

    if (await tableExists(prisma, "Order")) {
      await addForeignKey(
        prisma,
        "SalePayment",
        "SalePayment_orderId_fkey",
        `ALTER TABLE \`SalePayment\`
          ADD CONSTRAINT \`SalePayment_orderId_fkey\`
          FOREIGN KEY (\`orderId\`) REFERENCES \`Order\`(\`id\`)
          ON DELETE SET NULL ON UPDATE CASCADE`,
      );
    }

    await prisma.$executeRawUnsafe(`
      INSERT INTO \`SalePayment\` (
        \`id\`, \`saleId\`, \`amount\`, \`method\`, \`paidAt\`, \`receiptPath\`, \`receiptFileName\`,
        \`orderId\`, \`source\`, \`createdByEmail\`, \`observation\`, \`createdAt\`, \`updatedAt\`
      )
      SELECT
        CONCAT('bf_', \`id\`),
        \`id\`,
        \`total\`,
        COALESCE(\`paymentMethod\`, 'other'),
        \`soldAt\`,
        \`receiptPath\`,
        \`receiptFileName\`,
        \`orderId\`,
        CASE
          WHEN \`source\` = 'ORDER_PAID' THEN 'ORDER_PAID'
          WHEN \`source\` = 'EXTERNAL_API' THEN 'EXTERNAL_API'
          ELSE 'MANUAL'
        END,
        \`createdByEmail\`,
        \`observation\`,
        \`createdAt\`,
        \`updatedAt\`
      FROM \`Sale\`
      WHERE NOT EXISTS (
        SELECT 1 FROM \`SalePayment\` AS \`existing\` WHERE \`existing\`.\`saleId\` = \`Sale\`.\`id\`
      )
      AND (
        \`source\` IN ('ORDER_PAID', 'EXTERNAL_API')
        OR (\`receiptPath\` IS NOT NULL AND \`receiptPath\` <> '')
      )
    `);
  })();

  ensurePromises.set(prisma, pending);

  try {
    await pending;
  } catch (error) {
    ensurePromises.delete(prisma);
    throw error;
  }
}

export async function withSalePaymentTable<T>(
  operation: () => Promise<T>,
  client?: PrismaClient | null,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!isMissingSalePaymentTableError(error)) {
      throw error;
    }

    await ensureSalePaymentTable(client);
    return operation();
  }
}
