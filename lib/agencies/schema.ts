import type { PrismaClient } from "@prisma/client";

import { DEFAULT_AGENCIES, SMARTPRO_AGENCY_ID } from "./types";

const promises = new WeakMap<object, Promise<void>>();

async function columns(client: PrismaClient, table: string): Promise<Set<string>> {
  const rows = (await client.$queryRawUnsafe(`
    SELECT COLUMN_NAME FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${table}'
  `)) as Array<{ COLUMN_NAME: string }>;
  return new Set(rows.map((row) => row.COLUMN_NAME));
}

export async function ensureAgencySchema(client: PrismaClient): Promise<void> {
  const existing = promises.get(client);
  if (existing) return existing;

  const pending = (async () => {
    await client.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`Agency\` (
        \`id\` VARCHAR(64) NOT NULL,
        \`brandName\` VARCHAR(191) NOT NULL,
        \`legalName\` VARCHAR(191) NOT NULL DEFAULT '',
        \`rut\` VARCHAR(32) NOT NULL DEFAULT '',
        \`tagline\` VARCHAR(191) NOT NULL DEFAULT '',
        \`address\` VARCHAR(191) NOT NULL DEFAULT '',
        \`commune\` VARCHAR(191) NOT NULL DEFAULT '',
        \`postalCode\` VARCHAR(32) NOT NULL DEFAULT '',
        \`offices\` TEXT NOT NULL,
        \`phone\` VARCHAR(64) NOT NULL DEFAULT '',
        \`contactName\` VARCHAR(191) NOT NULL DEFAULT '',
        \`email\` VARCHAR(191) NOT NULL DEFAULT '',
        \`website\` VARCHAR(255) NOT NULL DEFAULT '',
        \`logoUrl\` VARCHAR(500) NOT NULL DEFAULT '',
        \`bankAccountHolder\` VARCHAR(191) NOT NULL DEFAULT '',
        \`bankRut\` VARCHAR(32) NOT NULL DEFAULT '',
        \`bankName\` VARCHAR(100) NOT NULL DEFAULT '',
        \`bankAccountType\` VARCHAR(100) NOT NULL DEFAULT '',
        \`bankAccountNumber\` VARCHAR(100) NOT NULL DEFAULT '',
        \`bankEmail\` VARCHAR(191) NOT NULL DEFAULT '',
        \`active\` BOOLEAN NOT NULL DEFAULT TRUE,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    const quoteColumns = await columns(client, "Quote");
    if (!quoteColumns.has("agencyId")) {
      await client.$executeRawUnsafe("ALTER TABLE `Quote` ADD COLUMN `agencyId` VARCHAR(64) NOT NULL DEFAULT 'smartpro'");
    }
    if (!quoteColumns.has("agencySnapshot")) {
      await client.$executeRawUnsafe("ALTER TABLE `Quote` ADD COLUMN `agencySnapshot` JSON NULL");
    }

    const saleColumns = await columns(client, "Sale");
    if (!saleColumns.has("agencyId")) {
      await client.$executeRawUnsafe("ALTER TABLE `Sale` ADD COLUMN `agencyId` VARCHAR(64) NOT NULL DEFAULT 'smartpro'");
    }
    if (!saleColumns.has("agencySnapshot")) {
      await client.$executeRawUnsafe("ALTER TABLE `Sale` ADD COLUMN `agencySnapshot` JSON NULL");
    }

    for (const agency of DEFAULT_AGENCIES) {
      const values = [
        agency.id, agency.brandName, agency.legalName, agency.rut, agency.tagline, agency.address, agency.commune,
        agency.postalCode, agency.offices, agency.phone, agency.contactName, agency.email, agency.website, agency.logoUrl,
        agency.bankAccountHolder, agency.bankRut, agency.bankName, agency.bankAccountType,
        agency.bankAccountNumber, agency.bankEmail, agency.active,
      ];
      await client.$executeRawUnsafe(`
        INSERT INTO \`Agency\` (
          \`id\`, \`brandName\`, \`legalName\`, \`rut\`, \`tagline\`, \`address\`, \`commune\`, \`postalCode\`, \`offices\`,
          \`phone\`, \`contactName\`, \`email\`, \`website\`, \`logoUrl\`, \`bankAccountHolder\`, \`bankRut\`,
          \`bankName\`, \`bankAccountType\`, \`bankAccountNumber\`, \`bankEmail\`, \`active\`, \`updatedAt\`
        ) VALUES (${values.map(() => "?").join(", ")}, CURRENT_TIMESTAMP(3))
        ON DUPLICATE KEY UPDATE \`id\` = VALUES(\`id\`)
      `, ...values);
    }

    const smartpro = DEFAULT_AGENCIES.find((agency) => agency.id === SMARTPRO_AGENCY_ID)!;
    const smartproSnapshot = JSON.stringify(smartpro);
    await client.$executeRawUnsafe(
      "UPDATE `Quote` SET `agencyId` = 'smartpro', `agencySnapshot` = ? WHERE `agencySnapshot` IS NULL OR `agencyId` = ''",
      smartproSnapshot,
    );
    await client.$executeRawUnsafe(`
      UPDATE \`Sale\` AS sale
      LEFT JOIN \`Quote\` AS quote ON quote.\`id\` = sale.\`quoteId\`
      SET sale.\`agencyId\` = COALESCE(NULLIF(quote.\`agencyId\`, ''), 'smartpro'),
          sale.\`agencySnapshot\` = COALESCE(quote.\`agencySnapshot\`, ?)
      WHERE sale.\`agencySnapshot\` IS NULL OR sale.\`agencyId\` = ''
    `, smartproSnapshot);
  })();

  promises.set(client, pending);
  try {
    await pending;
  } catch (error) {
    promises.delete(client);
    throw error;
  }
}
