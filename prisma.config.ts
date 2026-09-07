import { readFileSync } from "node:fs";
import path from "node:path";

import { defineConfig } from "prisma/config";

function loadLocalEnv() {
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
    // .env is optional when the host already injects DATABASE_URL.
  }
}

function encodeDatabaseUrl(raw: string) {
  const url = new URL(raw);
  const user = encodeURIComponent(decodeURIComponent(url.username));
  const password = encodeURIComponent(decodeURIComponent(url.password));
  const database = url.pathname.replace(/^\/+/, "");
  const port = url.port || "3306";

  return `${url.protocol}//${user}:${password}@${url.hostname}:${port}/${database}`;
}

loadLocalEnv();

const databaseUrl = process.env.DATABASE_URL ?? process.env.DB_CONNECTION_URL ?? "";

if (!databaseUrl) {
  throw new Error("Falta DATABASE_URL para conectar Prisma a MySQL.");
}

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: encodeDatabaseUrl(databaseUrl),
  },
});
