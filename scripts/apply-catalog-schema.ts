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

  const serviceCount = (await prisma.$queryRawUnsafe("SELECT COUNT(*) as c FROM `Service`")) as Array<{
    c: bigint | number;
  }>;
  const categoryCount = (await prisma.$queryRawUnsafe(
    "SELECT COUNT(*) as c FROM `ServiceCategory`",
  )) as Array<{ c: bigint | number }>;

  if (Number(serviceCount[0].c) > 0 || Number(categoryCount[0].c) > 0) {
    throw new Error("Hay datos en Service/ServiceCategory. Abortando para no perder información.");
  }

  await exec("DROP TABLE IF EXISTS `Service`");

  const categoryColumns = (await prisma.$queryRawUnsafe("SHOW COLUMNS FROM `ServiceCategory`")) as Array<{
    Field: string;
  }>;
  const fields = new Set(categoryColumns.map((column) => column.Field));

  if (!fields.has("slug")) {
    await exec("ALTER TABLE `ServiceCategory` ADD COLUMN `slug` VARCHAR(191) NOT NULL DEFAULT ''");
  }
  if (!fields.has("description")) {
    await exec("ALTER TABLE `ServiceCategory` ADD COLUMN `description` TEXT NOT NULL");
  }
  if (!fields.has("sortOrder")) {
    await exec("ALTER TABLE `ServiceCategory` ADD COLUMN `sortOrder` INTEGER NOT NULL DEFAULT 0");
  }
  if (!fields.has("status")) {
    await exec("ALTER TABLE `ServiceCategory` ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE'");
  }
  if (!fields.has("updatedAt")) {
    await exec(
      "ALTER TABLE `ServiceCategory` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)",
    );
  }

  await exec("ALTER TABLE `ServiceCategory` MODIFY `slug` VARCHAR(191) NOT NULL");
  await exec("CREATE UNIQUE INDEX `ServiceCategory_slug_key` ON `ServiceCategory`(`slug`)");
  await exec("CREATE INDEX `ServiceCategory_status_idx` ON `ServiceCategory`(`status`)");
  await exec("CREATE INDEX `ServiceCategory_sortOrder_idx` ON `ServiceCategory`(`sortOrder`)");

  await exec(`
    CREATE TABLE IF NOT EXISTS \`ServiceSubcategory\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`categoryId\` VARCHAR(191) NOT NULL,
      \`name\` VARCHAR(191) NOT NULL,
      \`slug\` VARCHAR(191) NOT NULL,
      \`sortOrder\` INTEGER NOT NULL DEFAULT 0,
      \`status\` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`ServiceSubcategory_categoryId_slug_key\` (\`categoryId\`, \`slug\`),
      INDEX \`ServiceSubcategory_categoryId_idx\` (\`categoryId\`),
      INDEX \`ServiceSubcategory_status_idx\` (\`status\`),
      CONSTRAINT \`ServiceSubcategory_categoryId_fkey\`
        FOREIGN KEY (\`categoryId\`) REFERENCES \`ServiceCategory\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS \`ServicePlan\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`subcategoryId\` VARCHAR(191) NOT NULL,
      \`name\` VARCHAR(191) NOT NULL,
      \`slug\` VARCHAR(191) NOT NULL,
      \`price\` DECIMAL(12, 2) NOT NULL,
      \`pricePrefix\` VARCHAR(191) NOT NULL DEFAULT '',
      \`taxLabel\` VARCHAR(191) NOT NULL DEFAULT '+ IVA',
      \`taxRate\` DECIMAL(5, 4) NOT NULL DEFAULT 0.1900,
      \`summary\` TEXT NOT NULL,
      \`badge\` VARCHAR(191) NOT NULL DEFAULT '',
      \`note\` TEXT NOT NULL,
      \`featureGroupTitle\` VARCHAR(191) NOT NULL DEFAULT '',
      \`highlighted\` BOOLEAN NOT NULL DEFAULT false,
      \`sortOrder\` INTEGER NOT NULL DEFAULT 0,
      \`status\` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
      \`icon\` VARCHAR(191) NOT NULL DEFAULT '',
      \`externalLink\` VARCHAR(191) NOT NULL DEFAULT '',
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`ServicePlan_subcategoryId_slug_key\` (\`subcategoryId\`, \`slug\`),
      INDEX \`ServicePlan_subcategoryId_idx\` (\`subcategoryId\`),
      INDEX \`ServicePlan_status_idx\` (\`status\`),
      INDEX \`ServicePlan_highlighted_idx\` (\`highlighted\`),
      INDEX \`ServicePlan_sortOrder_idx\` (\`sortOrder\`),
      CONSTRAINT \`ServicePlan_subcategoryId_fkey\`
        FOREIGN KEY (\`subcategoryId\`) REFERENCES \`ServiceSubcategory\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS \`ServicePlanItem\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`planId\` VARCHAR(191) NOT NULL,
      \`label\` TEXT NOT NULL,
      \`slug\` VARCHAR(191) NOT NULL,
      \`sortOrder\` INTEGER NOT NULL DEFAULT 0,
      \`status\` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`ServicePlanItem_planId_slug_key\` (\`planId\`, \`slug\`),
      INDEX \`ServicePlanItem_planId_idx\` (\`planId\`),
      CONSTRAINT \`ServicePlanItem_planId_fkey\`
        FOREIGN KEY (\`planId\`) REFERENCES \`ServicePlan\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  console.log("Catalog schema applied.");
  await prisma.$disconnect();
}

void main();
