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

  if (!(await columnExists("Client", "commercialStatus"))) {
    await exec(`
      ALTER TABLE \`Client\`
      ADD COLUMN \`commercialStatus\` ENUM('PROSPECTO', 'EN_SEGUIMIENTO', 'CERRADO_PERDIDO') NOT NULL DEFAULT 'PROSPECTO'
    `);
    console.log("Added Client.commercialStatus");
  }

  if (!(await columnExists("Client", "assignedExecutiveId"))) {
    await exec("ALTER TABLE `Client` ADD COLUMN `assignedExecutiveId` VARCHAR(191) NULL");
    console.log("Added Client.assignedExecutiveId");
  }

  if (!(await indexExists("Client", "Client_commercialStatus_idx"))) {
    await exec("CREATE INDEX `Client_commercialStatus_idx` ON `Client`(`commercialStatus`)");
  }

  if (!(await indexExists("Client", "Client_assignedExecutiveId_idx"))) {
    await exec("CREATE INDEX `Client_assignedExecutiveId_idx` ON `Client`(`assignedExecutiveId`)");
  }

  if ((await tableExists("User")) && !(await indexExists("Client", "Client_assignedExecutiveId_fkey"))) {
    await exec(`
      ALTER TABLE \`Client\`
      ADD CONSTRAINT \`Client_assignedExecutiveId_fkey\`
      FOREIGN KEY (\`assignedExecutiveId\`) REFERENCES \`User\`(\`id\`)
      ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log("Added Client.assignedExecutiveId foreign key");
  }

  console.log("Client assignment schema applied.");
  await prisma.$disconnect();
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
