import { readFileSync } from "node:fs";
import path from "node:path";

import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

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

function createMariaDbAdapter() {
  const connectionString = process.env.DATABASE_URL ?? process.env.DB_CONNECTION_URL ?? "";

  if (!connectionString) {
    return undefined;
  }

  try {
    const url = new URL(connectionString);
    const database = url.pathname.replace(/^\/+/, "") || undefined;

    return new PrismaMariaDb({
      host: url.hostname,
      port: url.port ? Number(url.port) : 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database,
      ssl: false,
      // The remote host caps total connections; keep each client's pool small
      // so ad-hoc scripts and the dev server don't exhaust the server-side limit.
      connectionLimit: 3,
    });
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
