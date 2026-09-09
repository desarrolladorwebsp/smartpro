import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DIAGNOSTIC_ROUTE = "db-test";
const QUERY_TIMEOUT_MS = 15_000;

type DbTestSuccess = {
  ok: true;
  database: "connected";
};

type DbTestFailure = {
  ok: false;
  database: "disconnected";
  error: string;
};

function diagnosticHeaders() {
  return {
    "Cache-Control": "no-store",
    "X-SmartPro-Diagnostic": DIAGNOSTIC_ROUTE,
  };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("DIAGNOSTIC_TIMEOUT"));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error: unknown) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function sanitizeDbError(error: unknown): string {
  if (error instanceof Error && error.message === "DIAGNOSTIC_TIMEOUT") {
    return "Tiempo de espera agotado al verificar la conexión.";
  }

  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (message.includes("pool timeout") || message.includes("45028")) {
    return "No se pudo obtener conexión dentro del tiempo límite.";
  }

  if (message.includes("econnrefused")) {
    return "Conexión rechazada por el servidor de base de datos.";
  }

  if (message.includes("enotfound") || message.includes("eai_again")) {
    return "No se pudo resolver el host de la base de datos.";
  }

  if (message.includes("access denied") || message.includes("er_access_denied_error")) {
    return "Acceso denegado a la base de datos.";
  }

  if (message.includes("er_bad_db_error")) {
    return "La base de datos configurada no está disponible.";
  }

  return "No se pudo conectar con la base de datos.";
}

export async function GET() {
  const prisma = getPrismaClient();

  if (!prisma) {
    const body: DbTestFailure = {
      ok: false,
      database: "disconnected",
      error: "Cliente de base de datos no configurado.",
    };

    return NextResponse.json(body, {
      status: 503,
      headers: diagnosticHeaders(),
    });
  }

  try {
    await withTimeout(
      prisma.$queryRaw<Array<{ ok: number }>>`SELECT 1 AS ok`,
      QUERY_TIMEOUT_MS,
    );

    const body: DbTestSuccess = {
      ok: true,
      database: "connected",
    };

    return NextResponse.json(body, {
      status: 200,
      headers: diagnosticHeaders(),
    });
  } catch (error) {
    console.error("[smartpro:diagnostic:db-test]", error);

    const body: DbTestFailure = {
      ok: false,
      database: "disconnected",
      error: sanitizeDbError(error),
    };

    return NextResponse.json(body, {
      status: 503,
      headers: diagnosticHeaders(),
    });
  }
}
