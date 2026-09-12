import { prisma } from "../lib/db";
import { seedWebDevelopmentPortfolio } from "../lib/portfolio/seed";

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

async function main() {
  if (!prisma) {
    throw new Error("Prisma client is not available.");
  }

  if (!(await tableExists("ServiceCategory")) || !(await tableExists("ServiceSubcategory"))) {
    throw new Error("Se requieren ServiceCategory y ServiceSubcategory antes de crear el portafolio.");
  }

  if (!(await tableExists("PortfolioProject"))) {
    await exec(`
      CREATE TABLE \`PortfolioProject\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`categoryId\` VARCHAR(191) NOT NULL,
        \`subcategoryId\` VARCHAR(191) NOT NULL,
        \`title\` VARCHAR(191) NOT NULL,
        \`slug\` VARCHAR(191) NOT NULL,
        \`summary\` TEXT NOT NULL,
        \`image\` VARCHAR(191) NOT NULL DEFAULT '',
        \`url\` VARCHAR(191) NOT NULL DEFAULT '',
        \`tags\` JSON NOT NULL DEFAULT (JSON_ARRAY()),
        \`status\` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
        \`sortOrder\` INTEGER NOT NULL DEFAULT 0,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`PortfolioProject_categoryId_slug_key\` (\`categoryId\`, \`slug\`),
        INDEX \`PortfolioProject_categoryId_status_sortOrder_idx\` (\`categoryId\`, \`status\`, \`sortOrder\`),
        INDEX \`PortfolioProject_subcategoryId_idx\` (\`subcategoryId\`),
        CONSTRAINT \`PortfolioProject_categoryId_fkey\`
          FOREIGN KEY (\`categoryId\`) REFERENCES \`ServiceCategory\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`PortfolioProject_subcategoryId_fkey\`
          FOREIGN KEY (\`subcategoryId\`) REFERENCES \`ServiceSubcategory\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    console.log("Created PortfolioProject table");
  }

  const seeded = await seedWebDevelopmentPortfolio();
  console.log(`Portfolio seed: ${seeded.created} creados, ${seeded.updated} actualizados.`);
  console.log("Portfolio schema applied.");
  process.exit(0);
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
