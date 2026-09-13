import { readFileSync } from "node:fs";
import path from "node:path";

import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { seedWebDevelopmentPortfolio } from "../lib/portfolio/seed";

const DATABASES = ["smartpro_dev", "smartpro_db"] as const;

function parseEnvValue(raw: string): string {
  const trimmed = raw.trim();

  if (
    (trimmed.startsWith("\"") && trimmed.includes("\"", 1)) ||
    (trimmed.startsWith("'") && trimmed.includes("'", 1))
  ) {
    const quote = trimmed[0];
    const closingQuoteIndex = trimmed.indexOf(quote, 1);
    return trimmed.slice(1, closingQuoteIndex);
  }

  return trimmed.split("#")[0]?.trim() ?? "";
}

function loadEnvFiles() {
  for (const file of [".env.local", ".env"]) {
    try {
      const contents = readFileSync(path.join(process.cwd(), file), "utf8");
      for (const line of contents.split(/\r?\n/)) {
        if (!line || line.startsWith("#") || !line.includes("=")) continue;
        const separator = line.indexOf("=");
        const key = line.slice(0, separator).trim();
        const value = parseEnvValue(line.slice(separator + 1));
        if (!(key in process.env)) process.env[key] = value;
      }
    } catch {
      // optional
    }
  }
}

function createClient(database: string) {
  const host = process.env.DB_HOST?.trim();
  const user = process.env.DB_USER?.trim();
  const password = process.env.DB_PASSWORD ?? "";
  const port = process.env.DB_PORT || "3306";

  if (!host || !user) {
    throw new Error("Faltan DB_HOST o DB_USER.");
  }

  const url = new URL("mariadb://localhost");
  url.username = user;
  url.password = password;
  url.hostname = host;
  url.port = String(port);
  url.pathname = `/${database}`;
  url.searchParams.set("allowPublicKeyRetrieval", "true");
  url.searchParams.set("connectTimeout", "30000");
  url.searchParams.set("acquireTimeout", "30000");
  url.searchParams.set("connectionLimit", "1");

  return new PrismaClient({
    adapter: new PrismaMariaDb(url.toString()),
    log: ["error"],
  });
}

async function main() {
  loadEnvFiles();

  for (const database of DATABASES) {
    const prisma = createClient(database);
    try {
      const result = await seedWebDevelopmentPortfolio(prisma);
      console.log(
        `${database}: ${result.created} creados, ${result.updated} actualizados, ${result.skipped} omitidos.`,
      );
    } catch (error) {
      console.error(`${database}:`, error instanceof Error ? error.message : error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
