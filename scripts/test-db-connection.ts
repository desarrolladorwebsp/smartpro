import { config } from "dotenv";
import mariadb from "mariadb";

config({ path: ".env.local" });
config({ path: ".env" });

function mask(value: string | undefined) {
  if (!value) return "(missing)";
  if (value.length <= 2) return "**";
  return `${value.slice(0, 2)}***(${value.length} chars)`;
}

async function testTcp(host: string, port: number) {
  const net = await import("node:net");

  return new Promise<{ ok: boolean; error?: string }>((resolve) => {
    const socket = net.createConnection({ host, port });
    const timer = setTimeout(() => {
      socket.destroy();
      resolve({ ok: false, error: "TCP timeout (10s)" });
    }, 10_000);

    socket.once("connect", () => {
      clearTimeout(timer);
      socket.end();
      resolve({ ok: true });
    });

    socket.once("error", (error: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      resolve({ ok: false, error: error.code ?? error.message });
    });
  });
}

async function testMariaDbPool() {
  const host = process.env.DB_HOST?.trim();
  const user = process.env.DB_USER?.trim();
  const password = process.env.DB_PASSWORD ?? "";
  const database = process.env.DB_NAME?.trim();
  const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;

  if (!host || !user || !database) {
    return { ok: false, stage: "mariadb-pool", error: "Missing DB_HOST, DB_USER or DB_NAME" };
  }

  const pool = mariadb.createPool({
    host,
    port,
    user,
    password,
    database,
    connectTimeout: 10_000,
    acquireTimeout: 10_000,
    connectionLimit: 1,
    minimumIdle: 0,
    allowPublicKeyRetrieval: true,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  });

  try {
    const rows = await pool.query("SELECT 1 AS ok");
    return { ok: true, stage: "mariadb-pool", rows };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const code = error && typeof error === "object" && "code" in error ? String((error as { code?: string }).code) : "";
    return { ok: false, stage: "mariadb-pool", error: code || message.split("\n")[0] };
  } finally {
    await pool.end().catch(() => undefined);
  }
}

async function testMariaDbDirect() {
  const host = process.env.DB_HOST?.trim();
  const user = process.env.DB_USER?.trim();
  const password = process.env.DB_PASSWORD ?? "";
  const database = process.env.DB_NAME?.trim();
  const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;

  if (!host || !user || !database) {
    return { ok: false, stage: "config", error: "Missing DB_HOST, DB_USER or DB_NAME" };
  }

  let connection: mariadb.Connection | undefined;

  try {
    connection = await mariadb.createConnection({
      host,
      port,
      user,
      password,
      database,
      connectTimeout: 10_000,
      allowPublicKeyRetrieval: true,
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    });

    const rows = await connection.query("SELECT 1 AS ok");
    return { ok: true, stage: "mariadb-direct", rows };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const code = error && typeof error === "object" && "code" in error ? String((error as { code?: string }).code) : "";
    return { ok: false, stage: "mariadb-direct", error: code || message.split("\n")[0] };
  } finally {
    await connection?.end().catch(() => undefined);
  }
}

async function testPrisma(getPrismaClient: () => import("@prisma/client").PrismaClient | null) {
  const prisma = getPrismaClient();

  if (!prisma) {
    return { ok: false, stage: "prisma", error: "Prisma client not configured" };
  }

  try {
    const rows = await prisma.$queryRaw<Array<{ ok: number }>>`SELECT 1 AS ok`;
    return { ok: true, stage: "prisma", rows };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, stage: "prisma", error: message.split("\n")[0] };
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

async function main() {
  const { getPrismaClient } = await import("../lib/db");

  const host = process.env.DB_HOST?.trim() ?? "(missing)";
  const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;
  const database = process.env.DB_NAME?.trim() ?? "(missing)";
  const user = process.env.DB_USER?.trim() ?? "(missing)";
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL || process.env.DB_CONNECTION_URL);

  console.log("Config summary:");
  console.log(`  host=${host}`);
  console.log(`  port=${port}`);
  console.log(`  database=${database}`);
  console.log(`  user=${user}`);
  console.log(`  password=${mask(process.env.DB_PASSWORD)}`);
  console.log(`  DATABASE_URL=${hasDatabaseUrl ? "set" : "missing"}`);
  console.log(`  DB_SSL=${process.env.DB_SSL ?? "false"}`);

  const tcp = await testTcp(host, port);
  console.log(`\nTCP ${host}:${port} -> ${tcp.ok ? "OK" : `FAIL (${tcp.error})`}`);

  const direct = await testMariaDbDirect();
  console.log(`MariaDB direct -> ${direct.ok ? "OK" : `FAIL (${direct.error})`}`);

  const pool = await testMariaDbPool();
  console.log(`MariaDB pool -> ${pool.ok ? "OK" : `FAIL (${pool.error})`}`);

  const prisma = await testPrisma(getPrismaClient);
  console.log(`Prisma SELECT 1 -> ${prisma.ok ? "OK" : `FAIL (${prisma.error})`}`);

  if (!prisma.ok) {
    process.exitCode = 1;
  }
}

void main();
