import { prisma } from "../lib/db";

async function exec(sql: string) {
  if (!prisma) {
    throw new Error("Prisma client is not available.");
  }

  await prisma.$executeRawUnsafe(sql);
}

async function main() {
  if (!prisma) {
    throw new Error("Prisma client is not available.");
  }

  await exec(`
    CREATE TABLE IF NOT EXISTS \`Quote\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`number\` VARCHAR(191) NOT NULL,
      \`status\` ENUM('DRAFT', 'CREATED', 'SENT', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'DRAFT',
      \`clientId\` VARCHAR(191) NOT NULL,
      \`createdByEmail\` VARCHAR(191) NOT NULL,
      \`notes\` TEXT NOT NULL,
      \`validUntil\` DATETIME(3) NULL,
      \`deliveryBusinessDays\` INTEGER NOT NULL DEFAULT 15,
      \`initialPaymentPercent\` INTEGER NOT NULL DEFAULT 50,
      \`subtotal\` DECIMAL(12, 2) NOT NULL,
      \`tax\` DECIMAL(12, 2) NOT NULL,
      \`total\` DECIMAL(12, 2) NOT NULL,
      \`sentAt\` DATETIME(3) NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`Quote_number_key\` (\`number\`),
      INDEX \`Quote_clientId_idx\` (\`clientId\`),
      INDEX \`Quote_status_idx\` (\`status\`),
      INDEX \`Quote_createdAt_idx\` (\`createdAt\`),
      CONSTRAINT \`Quote_clientId_fkey\`
        FOREIGN KEY (\`clientId\`) REFERENCES \`Client\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS \`QuoteItem\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`quoteId\` VARCHAR(191) NOT NULL,
      \`planId\` VARCHAR(191) NULL,
      \`planName\` VARCHAR(191) NOT NULL,
      \`categoryName\` VARCHAR(191) NOT NULL,
      \`subcategoryName\` VARCHAR(191) NOT NULL,
      \`quantity\` INTEGER NOT NULL,
      \`unitPrice\` DECIMAL(12, 2) NOT NULL,
      \`taxRate\` DECIMAL(5, 4) NOT NULL DEFAULT 0.1900,
      \`includedItems\` JSON NOT NULL,
      \`subtotal\` DECIMAL(12, 2) NOT NULL,
      \`tax\` DECIMAL(12, 2) NOT NULL,
      \`total\` DECIMAL(12, 2) NOT NULL,
      \`sortOrder\` INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (\`id\`),
      INDEX \`QuoteItem_quoteId_idx\` (\`quoteId\`),
      INDEX \`QuoteItem_planId_idx\` (\`planId\`),
      CONSTRAINT \`QuoteItem_quoteId_fkey\`
        FOREIGN KEY (\`quoteId\`) REFERENCES \`Quote\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT \`QuoteItem_planId_fkey\`
        FOREIGN KEY (\`planId\`) REFERENCES \`ServicePlan\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  await ensureQuoteColumns();

  console.log("Quotes schema applied.");
  await prisma.$disconnect();
}

async function columnExists(table: string, column: string): Promise<boolean> {
  if (!prisma) {
    throw new Error("Prisma client is not available.");
  }

  const columns = (await prisma.$queryRawUnsafe(`SHOW COLUMNS FROM \`${table}\``)) as Array<{ Field: string }>;
  return columns.some((entry) => entry.Field === column);
}

async function ensureQuoteColumns() {
  const additions: Array<{ column: string; sql: string }> = [
    {
      column: "deliveryBusinessDays",
      sql: "ALTER TABLE `Quote` ADD COLUMN `deliveryBusinessDays` INTEGER NOT NULL DEFAULT 15",
    },
    {
      column: "initialPaymentPercent",
      sql: "ALTER TABLE `Quote` ADD COLUMN `initialPaymentPercent` INTEGER NOT NULL DEFAULT 50",
    },
  ];

  for (const addition of additions) {
    if (!(await columnExists("Quote", addition.column))) {
      await exec(addition.sql);
      console.log(`Added Quote.${addition.column}`);
    }
  }
}

void main();
