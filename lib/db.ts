import { readFileSync } from "node:fs";
import path from "node:path";

import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

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
      const value = parseEnvValue(line.slice(separator + 1));

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
  const host = process.env.DB_HOST?.trim();
  const user = process.env.DB_USER?.trim();
  const password = process.env.DB_PASSWORD ?? "";
  const database = process.env.DB_NAME?.trim();
  const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;

  if (host && user && database) {
    return {
      host,
      port,
      user,
      password,
      database,
      ssl: process.env.DB_SSL === "true",
    };
  }

  const connectionString = process.env.DATABASE_URL ?? process.env.DB_CONNECTION_URL ?? "";

  if (connectionString) {
    return parseDatabaseUrl(connectionString);
  }

  return null;
}

function buildMariaDbConnectionUrl(settings: {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: boolean;
}) {
  const url = new URL("mariadb://localhost");
  url.username = settings.user;
  url.password = settings.password;
  url.hostname = settings.host;
  url.port = String(settings.port);
  url.pathname = `/${settings.database}`;
  url.searchParams.set("allowPublicKeyRetrieval", "true");
  url.searchParams.set("connectTimeout", "30000");
  url.searchParams.set("acquireTimeout", "30000");
  url.searchParams.set("connectionLimit", "1");

  if (settings.ssl) {
    url.searchParams.set("ssl", "true");
  }

  return url.toString();
}

function createMariaDbAdapter() {
  const settings = getConnectionSettings();

  if (!settings?.database) {
    return undefined;
  }

  try {
    return new PrismaMariaDb(
      buildMariaDbConnectionUrl({
        host: settings.host,
        port: settings.port,
        user: settings.user,
        password: settings.password,
        database: settings.database,
        ssl: settings.ssl,
      }),
    );
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
