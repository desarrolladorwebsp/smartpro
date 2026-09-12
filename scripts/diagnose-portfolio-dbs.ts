import { readFileSync } from "node:fs";
import path from "node:path";

import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

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

const HOST = process.env.DB_HOST!;
const USER = process.env.DB_USER!;
const PASSWORD = process.env.DB_PASSWORD ?? "";
const PORT = process.env.DB_PORT || "3306";

function createClient(database: string) {
  const url = new URL("mariadb://localhost");
  url.username = USER;
  url.password = PASSWORD;
  url.hostname = HOST;
  url.port = String(PORT);
  url.pathname = `/${database}`;
  url.searchParams.set("allowPublicKeyRetrieval", "true");
  url.searchParams.set("connectTimeout", "15000");
  url.searchParams.set("connectionLimit", "1");
  return new PrismaClient({ adapter: new PrismaMariaDb(url.toString()), log: ["error"] });
}

function prismaCode(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    return String((error as { code?: string }).code ?? "");
  }
  return "";
}

async function inspect(database: string) {
  const client = createClient(database);
  const report: Record<string, unknown> = {
    database,
    host: HOST ? `${HOST.slice(0, 8)}…` : null,
    provider: "mysql/mariadb",
    sqlite: false,
  };

  try {
    await client.$queryRawUnsafe("SELECT 1 AS ok");
    report.connection = "ok";

    const tables = (await client.$queryRawUnsafe("SHOW TABLES")) as Array<Record<string, string>>;
    const tableNames = tables.map((row) => Object.values(row)[0]);
    report.tables = {
      ServiceCategory: tableNames.includes("ServiceCategory"),
      ServiceSubcategory: tableNames.includes("ServiceSubcategory"),
      PortfolioProject: tableNames.includes("PortfolioProject"),
    };

    try {
      const category = await client.serviceCategory.findUnique({
        where: { slug: "desarrollo-web" },
        select: { id: true, name: true, slug: true },
      });
      report.desarrolloWeb = category;
    } catch (error) {
      report.categoryQueryError = {
        code: prismaCode(error),
        message: error instanceof Error ? error.message : String(error),
      };
    }

    try {
      const count = await client.portfolioProject.count();
      report.portfolioCount = count;
      report.portfolioQuery = "ok";
    } catch (error) {
      report.portfolioQuery = "fail";
      report.portfolioQueryError = {
        code: prismaCode(error),
        message: error instanceof Error ? error.message : String(error),
      };
    }

    try {
      await client.serviceCategory.findMany({
        where: { slug: "desarrollo-web" },
        include: { _count: { select: { portfolioProjects: true } } },
        take: 1,
      });
      report.categoryIncludeCount = "ok";
    } catch (error) {
      report.categoryIncludeCount = "fail";
      report.categoryIncludeError = {
        code: prismaCode(error),
        message: error instanceof Error ? error.message : String(error),
      };
    }
  } catch (error) {
    report.connection = "fail";
    report.connectionError = error instanceof Error ? error.message : String(error);
  } finally {
    await client.$disconnect();
  }

  return report;
}

async function main() {
  for (const database of ["smartpro_dev", "smartpro_db"]) {
    console.log(JSON.stringify(await inspect(database), null, 2));
  }
}

void main();
