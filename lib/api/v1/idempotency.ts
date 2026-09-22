import { Prisma } from "@prisma/client";

import { getPrismaClient } from "../../db";
import { ApiError } from "./errors";
import { sha256Hex } from "./signature";

export type StoredIdempotentResponse = {
  status: number;
  body: unknown;
};

function getPrisma() {
  const client = getPrismaClient();

  if (!client) {
    throw new Error("No hay conexión a la base de datos.");
  }

  return client;
}

export function normalizeIdempotencyKey(value: string | null | undefined): string {
  const key = String(value ?? "").trim();

  if (!key) {
    throw new ApiError(
      "invalid_request",
      "Falta la cabecera Idempotency-Key. Envía un identificador único por operación para evitar cobros o ventas duplicadas.",
    );
  }

  if (key.length > 200) {
    throw new ApiError("invalid_request", "Idempotency-Key no puede superar 200 caracteres.");
  }

  return key;
}

export async function findIdempotentResponse(input: {
  apiClientId: string;
  endpoint: string;
  key: string;
  requestHash: string;
}): Promise<StoredIdempotentResponse | null> {
  const existing = await getPrisma().apiIdempotencyRecord.findUnique({
    where: {
      apiClientId_endpoint_key: {
        apiClientId: input.apiClientId,
        endpoint: input.endpoint,
        key: input.key,
      },
    },
  });

  if (!existing) {
    return null;
  }

  if (existing.requestHash !== input.requestHash) {
    throw new ApiError(
      "idempotency_conflict",
      "Ese Idempotency-Key ya se usó con un cuerpo distinto. Usa una clave nueva para una operación distinta.",
    );
  }

  return { status: existing.status, body: existing.responseBody };
}

export async function saveIdempotentResponse(input: {
  apiClientId: string;
  endpoint: string;
  key: string;
  requestHash: string;
  status: number;
  body: unknown;
}): Promise<void> {
  try {
    await getPrisma().apiIdempotencyRecord.create({
      data: {
        apiClientId: input.apiClientId,
        endpoint: input.endpoint,
        key: input.key,
        requestHash: input.requestHash,
        status: input.status,
        responseBody: input.body as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    // Una carrera entre dos reintentos simultáneos deja un solo registro; el
    // segundo lee el almacenado en el siguiente intento.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return;
    }

    console.error("[smartpro:api:v1:idempotency]", error);
  }
}

export function buildRequestHash(method: string, path: string, body: string): string {
  return sha256Hex(`${method.toUpperCase()}\n${path}\n${body}`);
}
