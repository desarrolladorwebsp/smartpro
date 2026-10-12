import { prisma } from "../lib/db";

async function exec(sql: string) {
  if (!prisma) {
    throw new Error("Prisma client is not available.");
  }

  await prisma.$executeRawUnsafe(sql);
}

async function tableExists(table: string) {
  if (!prisma) return false;
  const rows = (await prisma.$queryRawUnsafe("SHOW TABLES")) as Array<Record<string, string>>;
  return rows.some((row) => Object.values(row)[0] === table);
}

async function foreignKeyExists(table: string, constraint: string) {
  if (!prisma) return false;
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

async function main() {
  if (!prisma) {
    throw new Error("Prisma client is not available.");
  }

  if (!(await tableExists("Client")) || !(await tableExists("Quote"))) {
    throw new Error("Se requieren las tablas Client y Quote antes de crear Sale.");
  }

  if (!(await tableExists("Sale"))) {
    await exec(`
      CREATE TABLE \`Sale\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`number\` VARCHAR(191) NOT NULL,
        \`status\` ENUM('REGISTERED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'REGISTERED',
        \`source\` ENUM('MANUAL', 'QUOTE_ACCEPTED') NOT NULL DEFAULT 'MANUAL',
        \`clientId\` VARCHAR(191) NOT NULL,
        \`quoteId\` VARCHAR(191) NOT NULL,
        \`executiveId\` VARCHAR(191) NULL,
        \`createdByEmail\` VARCHAR(191) NOT NULL,
        \`soldAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`observation\` TEXT NOT NULL,
        \`receiptPath\` VARCHAR(191) NOT NULL DEFAULT '',
        \`receiptFileName\` VARCHAR(191) NOT NULL DEFAULT '',
        \`subtotal\` DECIMAL(12, 2) NOT NULL,
        \`tax\` DECIMAL(12, 2) NOT NULL,
        \`total\` DECIMAL(12, 2) NOT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`Sale_number_key\` (\`number\`),
        UNIQUE INDEX \`Sale_quoteId_key\` (\`quoteId\`),
        INDEX \`Sale_clientId_idx\` (\`clientId\`),
        INDEX \`Sale_executiveId_idx\` (\`executiveId\`),
        INDEX \`Sale_status_idx\` (\`status\`),
        INDEX \`Sale_soldAt_idx\` (\`soldAt\`),
        CONSTRAINT \`Sale_clientId_fkey\`
          FOREIGN KEY (\`clientId\`) REFERENCES \`Client\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`Sale_quoteId_fkey\`
          FOREIGN KEY (\`quoteId\`) REFERENCES \`Quote\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT \`Sale_executiveId_fkey\`
          FOREIGN KEY (\`executiveId\`) REFERENCES \`User\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    console.log("Created Sale table");
  }

  if ((await tableExists("User")) && !(await foreignKeyExists("Sale", "Sale_executiveId_fkey"))) {
    try {
      await exec(`
        ALTER TABLE \`Sale\`
        ADD CONSTRAINT \`Sale_executiveId_fkey\`
        FOREIGN KEY (\`executiveId\`) REFERENCES \`User\`(\`id\`)
        ON DELETE SET NULL ON UPDATE CASCADE
      `);
      console.log("Added Sale.executiveId foreign key");
    } catch (error) {
      if (await foreignKeyExists("Sale", "Sale_executiveId_fkey")) {
        console.log("Sale.executiveId foreign key already present");
      } else {
        throw error;
      }
    }
  }

  if (!(await tableExists("SalePayment"))) {
    await exec(`
      CREATE TABLE \`SalePayment\` (
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
        INDEX \`SalePayment_paidAt_idx\` (\`paidAt\`),
        CONSTRAINT \`SalePayment_saleId_fkey\`
          FOREIGN KEY (\`saleId\`) REFERENCES \`Sale\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`SalePayment_orderId_fkey\`
          FOREIGN KEY (\`orderId\`) REFERENCES \`Order\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    console.log("Created SalePayment table");
  }

  await exec(`
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

  console.log("Sales schema applied.");
  await prisma.$disconnect();
  process.exit(0);
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
