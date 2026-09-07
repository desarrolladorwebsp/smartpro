import { prisma } from "../lib/db";

async function main() {
  if (!prisma) {
    throw new Error("Prisma client is not available.");
  }

  const tables = (await prisma.$queryRawUnsafe("SHOW TABLES")) as Array<Record<string, string>>;
  console.log(tables.map((row) => Object.values(row)[0]).join("\n"));

  for (const table of ["ServiceCategory", "Service", "ServiceSubcategory", "ServicePlan", "ServicePlanItem"]) {
    try {
      const columns = (await prisma.$queryRawUnsafe(`SHOW COLUMNS FROM \`${table}\``)) as Array<{
        Field: string;
        Type: string;
      }>;
      const countRows = (await prisma.$queryRawUnsafe(`SELECT COUNT(*) as c FROM \`${table}\``)) as Array<{
        c: bigint | number;
      }>;
      console.log(`\n== ${table} ==`);
      console.log(columns.map((column) => `${column.Field}:${column.Type}`).join(", "));
      console.log(`count=${Number(countRows[0].c)}`);
    } catch {
      console.log(`\n== ${table} == missing`);
    }
  }

  await prisma.$disconnect();
}

void main();
