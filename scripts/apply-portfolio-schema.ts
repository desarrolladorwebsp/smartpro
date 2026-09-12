import { readFileSync } from "node:fs";
import path from "node:path";

import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { ensurePortfolioProjectTable } from "../lib/portfolio/schema";

for (const file of [".env.local", ".env"]) {
  try {
    const contents = readFileSync(path.join(process.cwd(), file), "utf8");
    for (const line of contents.split(/\r?\n/)) {
      if (!line || line.startsWith("#") || !line.includes("=")) continue;
      const separator = line.indexOf("=");
      const key = line.slice(0, separator).trim();
      const value = line
        .slice(separator + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

function createClient(database: string) {
  const host = process.env.DB_HOST?.trim();
  const user = process.env.DB_USER?.trim();
  const password = process.env.DB_PASSWORD ?? "";
  const port = process.env.DB_PORT || "3306";

  if (!host || !user || !database) {
    throw new Error("Faltan DB_HOST, DB_USER o el nombre de la base.");
  }

  const url = new URL("mariadb://localhost");
  url.username = user;
  url.password = password;
  url.hostname = host;
  url.port = String(port);
  url.pathname = `/${database}`;
  url.searchParams.set("allowPublicKeyRetrieval", "true");
  url.searchParams.set("connectTimeout", "30000");
  url.searchParams.set("connectionLimit", "1");

  return new PrismaClient({ adapter: new PrismaMariaDb(url.toString()), log: ["error"] });
}

async function tableExists(client: PrismaClient, table: string) {
  const rows = (await client.$queryRawUnsafe("SHOW TABLES")) as Array<Record<string, string>>;
  return rows.some((row) => Object.values(row)[0] === table);
}

async function main() {
  const database = process.env.TARGET_DB || process.env.DB_NAME;
  if (!database) {
    throw new Error("Define TARGET_DB o DB_NAME.");
  }

  const prisma = createClient(database);

  try {
    if (!(await tableExists(prisma, "ServiceCategory")) || !(await tableExists(prisma, "ServiceSubcategory"))) {
      throw new Error("Se requieren ServiceCategory y ServiceSubcategory antes de crear el portafolio.");
    }

    await ensurePortfolioProjectTable(prisma);
    const exists = await tableExists(prisma, "PortfolioProject");
    if (!exists) {
      throw new Error(`PortfolioProject no quedó creada en ${database}.`);
    }

    const count = await prisma.portfolioProject.count();
    console.log(
      JSON.stringify({
        database,
        table: "PortfolioProject",
        applied: true,
        dropped: false,
        count,
      }),
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
