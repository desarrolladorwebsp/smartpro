import type { ApiClient, Prisma } from "@prisma/client";

import { getPrismaClient } from "../../db";
import { buildSecretPreview, generateApiCredentials, hashApiSecret, type ApiKeyEnvironment } from "./keys";
import { parseScopes, type ApiClientRecord, type ApiClientStatus, type ApiScope } from "./types";

function getPrisma() {
  const client = getPrismaClient();

  if (!client) {
    throw new Error("No hay conexión a la base de datos.");
  }

  return client;
}

function parseStringArray(value: Prisma.JsonValue | null | undefined): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function toStatus(value: string): ApiClientStatus {
  return value === "SUSPENDED" || value === "REVOKED" ? value : "ACTIVE";
}

export function toApiClientRecord(row: ApiClient): ApiClientRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    publicKey: row.publicKey,
    secretPreview: row.secretPreview,
    status: toStatus(row.status),
    scopes: parseScopes(row.scopes),
    allowedOrigins: parseStringArray(row.allowedOrigins),
    allowedReturnUrls: parseStringArray(row.allowedReturnUrls),
    allowedServiceIds: parseStringArray(row.allowedServiceIds),
    webhookUrl: row.webhookUrl,
    rateLimitPerMinute: row.rateLimitPerMinute,
    contactEmail: row.contactEmail,
    notes: row.notes,
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function findApiClientByPublicKey(publicKey: string): Promise<ApiClientRecord | null> {
  const normalized = publicKey.trim();

  if (!normalized) {
    return null;
  }

  const row = await getPrisma().apiClient.findUnique({ where: { publicKey: normalized } });
  return row ? toApiClientRecord(row) : null;
}

export async function findApiClientBySecret(secretKey: string): Promise<ApiClientRecord | null> {
  const normalized = secretKey.trim();

  if (!normalized) {
    return null;
  }

  const row = await getPrisma().apiClient.findUnique({ where: { secretHash: hashApiSecret(normalized) } });
  return row ? toApiClientRecord(row) : null;
}

export async function getApiClientById(id: string): Promise<ApiClientRecord | null> {
  const row = await getPrisma().apiClient.findUnique({ where: { id } });
  return row ? toApiClientRecord(row) : null;
}

export async function listApiClients(): Promise<ApiClientRecord[]> {
  const rows = await getPrisma().apiClient.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map(toApiClientRecord);
}

export async function touchApiClient(id: string): Promise<void> {
  await getPrisma()
    .apiClient.update({ where: { id }, data: { lastUsedAt: new Date() } })
    .catch(() => undefined);
}

export type CreateApiClientInput = {
  name: string;
  slug: string;
  scopes: ApiScope[];
  allowedOrigins: string[];
  allowedReturnUrls: string[];
  allowedServiceIds: string[];
  webhookUrl?: string;
  rateLimitPerMinute?: number;
  contactEmail?: string;
  notes?: string;
  environment?: ApiKeyEnvironment;
};

export type CreatedApiClient = {
  client: ApiClientRecord;
  secretKey: string;
  webhookSecret: string;
};

export async function createApiClient(input: CreateApiClientInput): Promise<{ client: ApiClientRecord; secretKey: string }> {
  const credentials = generateApiCredentials(input.environment ?? "live");

  const row = await getPrisma().apiClient.create({
    data: {
      name: input.name.trim(),
      slug: input.slug.trim(),
      publicKey: credentials.publicKey,
      secretHash: credentials.secretHash,
      secretPreview: credentials.secretPreview,
      scopes: input.scopes,
      allowedOrigins: input.allowedOrigins,
      allowedReturnUrls: input.allowedReturnUrls,
      allowedServiceIds: input.allowedServiceIds,
      webhookUrl: input.webhookUrl?.trim() ?? "",
      rateLimitPerMinute: input.rateLimitPerMinute ?? 120,
      contactEmail: input.contactEmail?.trim() ?? "",
      notes: input.notes?.trim() ?? "",
    },
  });

  return { client: toApiClientRecord(row), secretKey: credentials.secretKey };
}

export async function rotateApiClientSecret(
  id: string,
  environment: ApiKeyEnvironment = "live",
): Promise<{ client: ApiClientRecord; secretKey: string }> {
  const credentials = generateApiCredentials(environment);

  const row = await getPrisma().apiClient.update({
    where: { id },
    data: {
      publicKey: credentials.publicKey,
      secretHash: credentials.secretHash,
      secretPreview: buildSecretPreview(credentials.secretKey),
    },
  });

  return { client: toApiClientRecord(row), secretKey: credentials.secretKey };
}

export async function updateApiClient(
  id: string,
  updates: Partial<Omit<CreateApiClientInput, "environment">> & { status?: ApiClientStatus },
): Promise<ApiClientRecord> {
  const row = await getPrisma().apiClient.update({
    where: { id },
    data: {
      ...(updates.name === undefined ? {} : { name: updates.name.trim() }),
      ...(updates.scopes === undefined ? {} : { scopes: updates.scopes }),
      ...(updates.allowedOrigins === undefined ? {} : { allowedOrigins: updates.allowedOrigins }),
      ...(updates.allowedReturnUrls === undefined ? {} : { allowedReturnUrls: updates.allowedReturnUrls }),
      ...(updates.allowedServiceIds === undefined ? {} : { allowedServiceIds: updates.allowedServiceIds }),
      ...(updates.webhookUrl === undefined ? {} : { webhookUrl: updates.webhookUrl.trim() }),
      ...(updates.rateLimitPerMinute === undefined ? {} : { rateLimitPerMinute: updates.rateLimitPerMinute }),
      ...(updates.contactEmail === undefined ? {} : { contactEmail: updates.contactEmail.trim() }),
      ...(updates.notes === undefined ? {} : { notes: updates.notes.trim() }),
      ...(updates.status === undefined ? {} : { status: updates.status }),
    },
  });

  return toApiClientRecord(row);
}

export async function revokeApiClient(id: string): Promise<ApiClientRecord> {
  return updateApiClient(id, { status: "REVOKED" });
}

const ORIGIN_CACHE_TTL_MS = 60_000;
let originCache: { origins: string[]; expiresAt: number } | null = null;

/// Los orígenes de todas las aplicaciones activas. Se usa para responder el
/// preflight de CORS y los errores de autenticación, donde todavía no sabemos
/// qué credencial se está usando. El permiso real se valida por credencial.
export async function listActiveApiClientOrigins(now = Date.now()): Promise<string[]> {
  if (originCache && originCache.expiresAt > now) {
    return originCache.origins;
  }

  const client = getPrismaClient();

  if (!client) {
    return [];
  }

  try {
    const rows = await client.apiClient.findMany({
      where: { status: "ACTIVE" },
      select: { allowedOrigins: true },
    });

    const origins = [...new Set(rows.flatMap((row) => parseStringArray(row.allowedOrigins)))];
    originCache = { origins, expiresAt: now + ORIGIN_CACHE_TTL_MS };

    return origins;
  } catch (error) {
    console.error("[smartpro:api:v1:origins]", error);
    return originCache?.origins ?? [];
  }
}

export function clearApiClientOriginCache() {
  originCache = null;
}
