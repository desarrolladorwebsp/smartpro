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
      const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
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

async function inspect(database: string) {
  const client = createClient(database);
  const report: Record<string, unknown> = { database };

  try {
    await client.$queryRawUnsafe("SELECT 1 AS ok");
    report.connection = "ok";

    const tables = (await client.$queryRawUnsafe("SHOW TABLES")) as Array<Record<string, string>>;
    const tableNames = tables.map((row) => Object.values(row)[0]);
    report.tables = {
      Client: tableNames.includes("Client"),
      Quote: tableNames.includes("Quote"),
      QuoteItem: tableNames.includes("QuoteItem"),
      Order: tableNames.includes("Order"),
      User: tableNames.includes("User"),
    };

    async function columns(table: string) {
      if (!tableNames.includes(table)) return [];
      const rows = (await client.$queryRawUnsafe(`SHOW COLUMNS FROM \`${table}\``)) as Array<{ Field: string }>;
      return rows.map((row) => row.Field);
    }

    report.clientColumns = await columns("Client");
    report.quoteColumns = await columns("Quote");
    report.orderColumns = await columns("Order");

    const neededClient = ["commercialStatus", "assignedExecutiveId"];
    const clientColumns = report.clientColumns as string[];
    report.missingClientColumns = neededClient.filter((column) => !clientColumns.includes(column));

    const neededQuote = ["deliveryBusinessDays", "initialPaymentPercent"];
    const quoteColumns = report.quoteColumns as string[];
    report.missingQuoteColumns = neededQuote.filter((column) => !quoteColumns.includes(column));

    try {
      const count = await client.client.count();
      report.clientCount = count;
    } catch (error) {
      report.clientQueryError = error instanceof Error ? error.message : String(error);
    }

    try {
      const count = await client.quote.count();
      report.quoteCount = count;
    } catch (error) {
      report.quoteQueryError = error instanceof Error ? error.message : String(error);
    }

    try {
      const count = await client.order.count();
      report.orderCount = count;
      await client.order.findMany({ take: 1, include: { items: true } });
      report.orderQuery = "ok";
    } catch (error) {
      report.orderQueryError = error instanceof Error ? error.message : String(error);
    }

    try {
      const quotes = await client.quote.findMany({ take: 1, include: { items: true, client: true } });
      report.quoteQuery = "ok";
      report.quoteSample = quotes.length;
    } catch (error) {
      report.quoteQueryError = error instanceof Error ? error.message : String(error);
    }

    try {
      await client.client.findMany({
        take: 1,
        include: { assignedExecutive: { select: { id: true } } },
      });
      report.clientInclude = "ok";
    } catch (error) {
      report.clientIncludeError = error instanceof Error ? error.message : String(error);
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
  const databases = ["smartpro_dev", "smartpro_db"];
  for (const database of databases) {
    const report = await inspect(database);
    console.log(JSON.stringify(report, null, 2));
  }
}

void main();
