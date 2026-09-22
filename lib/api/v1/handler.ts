import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { authenticateApiRequest } from "./auth";
import { corsHeaders, isOriginAllowed, normalizeOrigin } from "./cors";
import { ApiError } from "./errors";
import {
  buildRequestHash,
  findIdempotentResponse,
  normalizeIdempotencyKey,
  saveIdempotentResponse,
} from "./idempotency";
import { readClientIp, writeApiRequestLog } from "./logging";
import { consumeRateLimit, rateLimitHeaders } from "./rate-limit";
import { apiFailure, apiSuccess, buildSuccessEnvelope, toApiError } from "./response";
import { listActiveApiClientOrigins, touchApiClient } from "./repository";
import { canonicalRequestPath, IDEMPOTENCY_HEADER } from "./signature";
import type { ApiAuthContext, ApiScope } from "./types";

export type ApiRouteResult = {
  data: unknown;
  status?: number;
  count?: number;
};

export type ApiRouteContext<Params> = {
  request: Request;
  auth: ApiAuthContext;
  params: Params;
  searchParams: URLSearchParams;
  body: Record<string, unknown>;
  rawBody: string;
  requestId: string;
};

export type ApiRouteConfig<Params> = {
  scope: ApiScope;
  methods: readonly string[];
  requireSecret?: boolean;
  requireIdempotency?: boolean;
  handler: (context: ApiRouteContext<Params>) => Promise<ApiRouteResult>;
};

type NextRouteContext<Params> = { params?: Promise<Params> } | undefined;

const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH", "DELETE"]);

async function resolveFallbackCorsOrigin(request: Request): Promise<string | null> {
  const origin = normalizeOrigin(request.headers.get("origin"));

  if (!origin) {
    return null;
  }

  const allowed = await listActiveApiClientOrigins();
  return isOriginAllowed(origin, allowed) ? origin : null;
}

function parseJsonBody(rawBody: string): Record<string, unknown> {
  if (!rawBody.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawBody) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new ApiError("invalid_json", "El cuerpo debe ser un objeto JSON.");
    }

    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError("invalid_json", "El cuerpo de la solicitud no es JSON válido.");
  }
}

export function createApiRoute<Params = Record<string, string>>(config: ApiRouteConfig<Params>) {
  return async function route(request: Request, context: NextRouteContext<Params>): Promise<NextResponse> {
    const startedAt = Date.now();
    const requestId = crypto.randomUUID();
    const path = canonicalRequestPath(request.url);
    const method = request.method.toUpperCase();
    let auth: ApiAuthContext | null = null;

    const finish = (response: NextResponse, errorCode?: string) => {
      void writeApiRequestLog({
        apiClientId: auth?.client.id ?? null,
        method,
        path,
        status: response.status,
        errorCode,
        origin: auth?.origin ?? normalizeOrigin(request.headers.get("origin")),
        ip: readClientIp(request),
        durationMs: Date.now() - startedAt,
      });

      return response;
    };

    try {
      const rawBody = METHODS_WITH_BODY.has(method) ? await request.text() : "";

      auth = await authenticateApiRequest({
        request,
        rawBody,
        scope: config.scope,
        requireSecret: config.requireSecret ?? false,
        requestId,
      });

      const allowedOrigin =
        auth.origin && isOriginAllowed(auth.origin, auth.client.allowedOrigins) ? auth.origin : null;
      const baseHeaders = corsHeaders(allowedOrigin, config.methods);

      const limit = consumeRateLimit(`${auth.client.id}:${config.scope}`, auth.client.rateLimitPerMinute);
      const headers = { ...baseHeaders, ...rateLimitHeaders(limit, startedAt) };

      if (!limit.allowed) {
        throw new ApiError("rate_limited", "Superaste el límite de solicitudes por minuto.");
      }

      const idempotencyKey =
        config.requireIdempotency && method === "POST"
          ? normalizeIdempotencyKey(request.headers.get(IDEMPOTENCY_HEADER))
          : null;
      const requestHash = idempotencyKey ? buildRequestHash(method, path, rawBody) : "";

      if (idempotencyKey) {
        const stored = await findIdempotentResponse({
          apiClientId: auth.client.id,
          endpoint: path.split("?")[0] ?? path,
          key: idempotencyKey,
          requestHash,
        });

        if (stored) {
          return finish(
            NextResponse.json(stored.body, {
              status: stored.status,
              headers: { ...headers, "Cache-Control": "no-store", "Idempotent-Replay": "true" },
            }),
          );
        }
      }

      const resolvedParams = ((await context?.params) ?? {}) as Params;

      const result = await config.handler({
        request,
        auth,
        params: resolvedParams,
        searchParams: new URL(request.url).searchParams,
        body: parseJsonBody(rawBody),
        rawBody,
        requestId,
      });

      void touchApiClient(auth.client.id);

      const status = result.status ?? 200;

      if (idempotencyKey) {
        await saveIdempotentResponse({
          apiClientId: auth.client.id,
          endpoint: path.split("?")[0] ?? path,
          key: idempotencyKey,
          requestHash,
          status,
          body: buildSuccessEnvelope(result.data, { requestId, count: result.count }),
        });
      }

      return finish(apiSuccess(result.data, { requestId, status, headers, count: result.count }));
    } catch (error) {
      const apiError = toApiError(error);

      if (apiError.code === "internal_error") {
        console.error("[smartpro:api:v1]", { path, method, error });
      }

      const fallbackOrigin =
        auth?.origin && isOriginAllowed(auth.origin, auth.client.allowedOrigins)
          ? auth.origin
          : await resolveFallbackCorsOrigin(request);

      return finish(
        apiFailure(apiError, {
          requestId,
          headers: corsHeaders(fallbackOrigin, config.methods),
        }),
        apiError.code,
      );
    }
  };
}

export function createApiPreflight(methods: readonly string[]) {
  return async function OPTIONS(request: Request): Promise<NextResponse> {
    const origin = await resolveFallbackCorsOrigin(request);

    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(origin, methods),
    });
  };
}
