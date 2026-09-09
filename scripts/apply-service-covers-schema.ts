import { prisma } from "../lib/db";
import { backfillDefaultServiceCoverImages } from "../lib/services/repository";

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

async function main() {
  if (!prisma) {
    throw new Error("Prisma client is not available.");
  }

  if (!(await columnExists("ServiceCategory", "coverImage"))) {
    await exec("ALTER TABLE `ServiceCategory` ADD COLUMN `coverImage` VARCHAR(191) NOT NULL DEFAULT ''");
    console.log("Added ServiceCategory.coverImage");
  }

  const updated = await backfillDefaultServiceCoverImages();
  console.log(`Backfilled ${updated} service cover images.`);
  await prisma.$disconnect();
}

void main();
