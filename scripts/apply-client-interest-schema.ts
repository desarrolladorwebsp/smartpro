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

async function columnExists(table: string, column: string) {
  if (!prisma) return false;
  const columns = (await prisma.$queryRawUnsafe(`SHOW COLUMNS FROM \`${table}\``)) as Array<{ Field: string }>;
  return columns.some((entry) => entry.Field === column);
}

async function indexExists(table: string, index: string) {
  if (!prisma) return false;
  const rows = (await prisma.$queryRawUnsafe(`SHOW INDEX FROM \`${table}\``)) as Array<{ Key_name: string }>;
  return rows.some((entry) => entry.Key_name === index);
}

async function main() {
  if (!prisma) {
    throw new Error("Prisma client is not available.");
  }

  if (!(await tableExists("Client"))) {
    throw new Error("No existe la tabla Client.");
  }

  if (await indexExists("Client", "Client_rut_key")) {
    await exec("ALTER TABLE `Client` DROP INDEX `Client_rut_key`");
    console.log("Dropped Client.rut unique index");
  }

  if (!(await indexExists("Client", "Client_rut_idx"))) {
    await exec("CREATE INDEX `Client_rut_idx` ON `Client`(`rut`)");
    console.log("Added Client.rut index");
  }

  const columns: Array<[string, string]> = [
    ["interestServiceId", "VARCHAR(191) NULL"],
    ["interestServiceName", "VARCHAR(191) NOT NULL DEFAULT ''"],
    ["interestSubcategoryId", "VARCHAR(191) NULL"],
    ["interestSubcategoryName", "VARCHAR(191) NOT NULL DEFAULT ''"],
    ["interestPlanId", "VARCHAR(191) NULL"],
    ["interestPlanName", "VARCHAR(191) NOT NULL DEFAULT ''"],
  ];

  for (const [column, definition] of columns) {
    if (!(await columnExists("Client", column))) {
      await exec(`ALTER TABLE \`Client\` ADD COLUMN \`${column}\` ${definition}`);
      console.log(`Added Client.${column}`);
    }
  }

  if (!(await indexExists("Client", "Client_interestServiceId_idx"))) {
    await exec("CREATE INDEX `Client_interestServiceId_idx` ON `Client`(`interestServiceId`)");
  }
  if (!(await indexExists("Client", "Client_interestSubcategoryId_idx"))) {
    await exec("CREATE INDEX `Client_interestSubcategoryId_idx` ON `Client`(`interestSubcategoryId`)");
  }
  if (!(await indexExists("Client", "Client_interestPlanId_idx"))) {
    await exec("CREATE INDEX `Client_interestPlanId_idx` ON `Client`(`interestPlanId`)");
  }

  if (await tableExists("ServiceCategory") && !(await indexExists("Client", "Client_interestServiceId_fkey"))) {
    await exec(`
      ALTER TABLE \`Client\`
      ADD CONSTRAINT \`Client_interestServiceId_fkey\`
      FOREIGN KEY (\`interestServiceId\`) REFERENCES \`ServiceCategory\`(\`id\`)
      ON DELETE SET NULL ON UPDATE CASCADE
    `);
  }

  if (await tableExists("ServiceSubcategory") && !(await indexExists("Client", "Client_interestSubcategoryId_fkey"))) {
    await exec(`
      ALTER TABLE \`Client\`
      ADD CONSTRAINT \`Client_interestSubcategoryId_fkey\`
      FOREIGN KEY (\`interestSubcategoryId\`) REFERENCES \`ServiceSubcategory\`(\`id\`)
      ON DELETE SET NULL ON UPDATE CASCADE
    `);
  }

  if (await tableExists("ServicePlan") && !(await indexExists("Client", "Client_interestPlanId_fkey"))) {
    await exec(`
      ALTER TABLE \`Client\`
      ADD CONSTRAINT \`Client_interestPlanId_fkey\`
      FOREIGN KEY (\`interestPlanId\`) REFERENCES \`ServicePlan\`(\`id\`)
      ON DELETE SET NULL ON UPDATE CASCADE
    `);
  }

  console.log("Client interest schema applied.");
  await prisma.$disconnect();
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
