import { readFileSync } from "node:fs";
import path from "node:path";

import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import type { PoolConfig } from "mariadb";

function loadLocalEnv() {
  if (process.env.DATABASE_URL || process.env.DB_CONNECTION_URL) {
    return;
  }

  try {
    const contents = readFileSync(path.join(process.cwd(), ".env"), "utf8");

    for (const line of contents.split(/\r?\n/)) {
      if (!line || line.startsWith("#") || !line.includes("=")) {
        continue;
      }

      const separator = line.indexOf("=");
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, "");

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // Next.js already injects env vars in the app runtime.
  }
}

loadLocalEnv();

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient | null;
};

function parseDatabaseUrl(connectionString: string) {
  const url = new URL(connectionString);

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\/+/, "") || undefined,
    ssl: url.searchParams.get("sslmode") === "require" || url.searchParams.get("ssl") === "true",
  };
}

function getConnectionSettings() {
  const connectionString = process.env.DATABASE_URL ?? process.env.DB_CONNECTION_URL ?? "";

  if (connectionString) {
    return parseDatabaseUrl(connectionString);
  }

  const host = process.env.DB_HOST?.trim();
  const user = process.env.DB_USER?.trim();
  const password = process.env.DB_PASSWORD ?? "";
  const database = process.env.DB_NAME?.trim();
  const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;

  if (!host || !user || !database) {
    return null;
  }

  return {
    host,
    port,
    user,
    password,
    database,
    ssl: process.env.DB_SSL === "true",
  };
}

function createMariaDbAdapter() {
  const settings = getConnectionSettings();

  if (!settings) {
    return undefined;
  }

  const isServerless = Boolean(process.env.VERCEL);

  const poolConfig: PoolConfig = {
    host: settings.host,
    port: settings.port,
    user: settings.user,
    password: settings.password,
    database: settings.database,
    ssl: settings.ssl ? { rejectUnauthorized: false } : false,
    // Shared hosting MySQL can be slow to accept remote connections (especially from Vercel).
    connectTimeout: 30_000,
    acquireTimeout: 30_000,
    initializationTimeout: 30_000,
    // Serverless: one connection per lambda avoids exhausting the host's connection cap.
    connectionLimit: isServerless ? 1 : 3,
    minimumIdle: 0,
    idleTimeout: isServerless ? 20 : 600,
    allowPublicKeyRetrieval: true,
    resetAfterUse: true,
  };

  try {
    return new PrismaMariaDb(poolConfig);
  } catch {
    return undefined;
  }
}

function buildPrismaClient(): PrismaClient | null {
  const adapter = createMariaDbAdapter();

  if (!adapter) {
    return null;
  }

  try {
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  } catch {
    return null;
  }
}

export function getPrismaClient(): PrismaClient | null {
  // Cache the outcome (including failures) so a bad/missing config doesn't
  // rebuild the client and its connection pool on every call while the
  // database is unreachable.
  if (globalForPrisma.prisma === undefined) {
    globalForPrisma.prisma = buildPrismaClient();
  }

  return globalForPrisma.prisma;
}

export const prisma = getPrismaClient();

export function hasDatabaseConnection(): boolean {
  return Boolean(getPrismaClient());
}
