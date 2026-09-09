import { prisma } from "../lib/db";

async function exec(sql: string) {
  if (!prisma) {
    throw new Error("Prisma client is not available.");
  }

  await prisma.$executeRawUnsafe(sql);
}

async function columnExists(table: string, column: string): Promise<boolean> {
  if (!prisma) {
    throw new Error("Prisma client is not available.");
  }

  const columns = (await prisma.$queryRawUnsafe(`SHOW COLUMNS FROM \`${table}\``)) as Array<{ Field: string }>;
  return columns.some((entry) => entry.Field === column);
}

async function ensureOrderColumns() {
  const paymentMethodColumn = (await prisma!.$queryRawUnsafe("SHOW COLUMNS FROM `Order` LIKE 'paymentMethod'")) as Array<{
    Type: string;
  }>;

  if (paymentMethodColumn[0] && !paymentMethodColumn[0].Type.includes("mercadopago")) {
    await exec(
      "ALTER TABLE `Order` MODIFY COLUMN `paymentMethod` ENUM('simulated', 'transbank', 'mercadopago') NOT NULL DEFAULT 'transbank'",
    );
    console.log("Updated Order.paymentMethod enum");
  }

  const additions: Array<{ column: string; sql: string }> = [
    {
      column: "updatedAt",
      sql: "ALTER TABLE `Order` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)",
    },
    {
      column: "preferenceId",
      sql: "ALTER TABLE `Order` ADD COLUMN `preferenceId` VARCHAR(191) NULL",
    },
    {
      column: "mercadopagoPaymentId",
      sql: "ALTER TABLE `Order` ADD COLUMN `mercadopagoPaymentId` VARCHAR(191) NULL",
    },
    {
      column: "processedPaymentKeys",
      sql: "ALTER TABLE `Order` ADD COLUMN `processedPaymentKeys` JSON NOT NULL DEFAULT (JSON_ARRAY())",
    },
    {
      column: "notificationEmailSentAt",
      sql: "ALTER TABLE `Order` ADD COLUMN `notificationEmailSentAt` DATETIME(3) NULL",
    },
  ];

  for (const addition of additions) {
    if (!(await columnExists("Order", addition.column))) {
      await exec(addition.sql);
      console.log(`Added Order.${addition.column}`);
    }
  }

  await exec("CREATE UNIQUE INDEX IF NOT EXISTS `Order_preferenceId_key` ON `Order`(`preferenceId`)").catch(() =>
    exec("CREATE UNIQUE INDEX `Order_preferenceId_key` ON `Order`(`preferenceId`)").catch(() => undefined),
  );
  await exec(
    "CREATE UNIQUE INDEX IF NOT EXISTS `Order_mercadopagoPaymentId_key` ON `Order`(`mercadopagoPaymentId`)",
  ).catch(() =>
    exec("CREATE UNIQUE INDEX `Order_mercadopagoPaymentId_key` ON `Order`(`mercadopagoPaymentId`)").catch(
      () => undefined,
    ),
  );
  await exec("CREATE INDEX IF NOT EXISTS `Order_createdAt_idx` ON `Order`(`createdAt`)").catch(() =>
    exec("CREATE INDEX `Order_createdAt_idx` ON `Order`(`createdAt`)").catch(() => undefined),
  );
}

async function main() {
  if (!prisma) {
    throw new Error("Prisma client is not available.");
  }

  await exec(`
    CREATE TABLE IF NOT EXISTS \`Order\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      \`orderStatus\` ENUM('pending', 'confirmed', 'cancelled') NOT NULL DEFAULT 'pending',
      \`customerName\` VARCHAR(191) NOT NULL,
      \`customerEmail\` VARCHAR(191) NOT NULL,
      \`customerPhone\` VARCHAR(191) NOT NULL,
      \`customerCompany\` VARCHAR(191) NULL,
      \`subtotal\` DECIMAL(12, 2) NOT NULL,
      \`tax\` DECIMAL(12, 2) NOT NULL,
      \`total\` DECIMAL(12, 2) NOT NULL,
      \`paymentStatus\` ENUM('pending', 'paid', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
      \`paymentMethod\` ENUM('simulated', 'transbank', 'mercadopago') NOT NULL DEFAULT 'transbank',
      \`preferenceId\` VARCHAR(191) NULL,
      \`mercadopagoPaymentId\` VARCHAR(191) NULL,
      \`processedPaymentKeys\` JSON NOT NULL DEFAULT (JSON_ARRAY()),
      \`notificationEmailSentAt\` DATETIME(3) NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`Order_preferenceId_key\` (\`preferenceId\`),
      UNIQUE INDEX \`Order_mercadopagoPaymentId_key\` (\`mercadopagoPaymentId\`),
      INDEX \`Order_customerEmail_idx\` (\`customerEmail\`),
      INDEX \`Order_orderStatus_idx\` (\`orderStatus\`),
      INDEX \`Order_paymentStatus_idx\` (\`paymentStatus\`),
      INDEX \`Order_createdAt_idx\` (\`createdAt\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS \`OrderItem\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`orderId\` VARCHAR(191) NOT NULL,
      \`serviceId\` VARCHAR(191) NULL,
      \`name\` VARCHAR(191) NOT NULL,
      \`category\` VARCHAR(191) NOT NULL,
      \`quantity\` INTEGER NOT NULL,
      \`unitPrice\` DECIMAL(12, 2) NOT NULL,
      \`priceDisplay\` VARCHAR(191) NULL,
      \`taxRate\` DECIMAL(5, 4) NOT NULL DEFAULT 0.1900,
      \`source\` VARCHAR(191) NULL,
      \`subtotal\` DECIMAL(12, 2) NOT NULL,
      \`tax\` DECIMAL(12, 2) NOT NULL,
      \`total\` DECIMAL(12, 2) NOT NULL,
      PRIMARY KEY (\`id\`),
      INDEX \`OrderItem_orderId_idx\` (\`orderId\`),
      CONSTRAINT \`OrderItem_orderId_fkey\`
        FOREIGN KEY (\`orderId\`) REFERENCES \`Order\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  await ensureOrderColumns();

  console.log("Orders schema applied.");
  await prisma.$disconnect();
}

void main();
