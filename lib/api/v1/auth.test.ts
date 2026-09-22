import test from "node:test";
import assert from "node:assert/strict";

process.env.API_KEY_PEPPER = "pimienta-de-prueba";

import { authenticateApiRequest } from "./auth";
import { isApiError } from "./errors";
import { signRequest } from "./signature";
import type { ApiClientRecord, ApiScope } from "./types";

const SECRET_KEY = `sk_live_${"a".repeat(40)}`;
const PUBLIC_KEY = `pk_live_${"b".repeat(32)}`;
const nowMs = 1_760_000_000_000;
const timestamp = Math.floor(nowMs / 1000);

function client(overrides: Partial<ApiClientRecord> = {}): ApiClientRecord {
  return {
    id: "api-client-1",
    name: "Desarrollo Web",
    slug: "desarrollo-web",
    publicKey: PUBLIC_KEY,
    secretPreview: "sk_live_…aaaa",
    status: "ACTIVE",
    scopes: ["catalog:read", "checkout:write", "orders:read"],
    allowedOrigins: ["https://desarrolloweb.cl"],
    allowedReturnUrls: ["https://desarrolloweb.cl/pago/resultado"],
    allowedServiceIds: [],
    webhookUrl: "",
    rateLimitPerMinute: 120,
    contactEmail: "",
    notes: "",
    lastUsedAt: null,
    createdAt: new Date(nowMs).toISOString(),
    updatedAt: new Date(nowMs).toISOString(),
    ...overrides,
  };
}

function secretRequest(options: { body?: string; path?: string; tamper?: boolean; timestampHeader?: string } = {}) {
  const body = options.body ?? JSON.stringify({ method: "webpay" });
  const path = options.path ?? "/api/v1/checkout/sessions";
  const signature = signRequest({ secret: SECRET_KEY, timestamp, method: "POST", path, body });

  return new Request(`https://smartpro.cl${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${SECRET_KEY}`,
      "content-type": "application/json",
      "x-smartpro-timestamp": options.timestampHeader ?? String(timestamp),
      "x-smartpro-signature": options.tamper ? "v1=0000" : signature,
    },
    body,
  });
}

function authenticate(
  request: Request,
  options: { scope?: ApiScope; requireSecret?: boolean; record?: ApiClientRecord | null; rawBody?: string } = {},
) {
  const record = options.record === undefined ? client() : options.record;

  return authenticateApiRequest({
    request,
    rawBody: options.rawBody ?? "",
    scope: options.scope ?? "checkout:write",
    requireSecret: options.requireSecret ?? false,
    requestId: "req-1",
    nowMs,
    secretKeyResolver: async () => record,
    publicKeyResolver: async () => record,
  });
}

async function expectError(promise: Promise<unknown>, code: string) {
  await assert.rejects(promise, (error: unknown) => {
    assert.ok(isApiError(error), "se esperaba un ApiError");
    assert.equal(error.code, code);
    return true;
  });
}

test("una solicitud firmada con clave secreta se autentica", async () => {
  const body = JSON.stringify({ method: "webpay" });
  const context = await authenticate(secretRequest({ body }), { rawBody: body });

  assert.equal(context.credential, "secret");
  assert.equal(context.client.slug, "desarrollo-web");
});

test("sin credencial responde missing_credentials", async () => {
  const request = new Request("https://smartpro.cl/api/v1/catalog");

  await expectError(authenticate(request, { scope: "catalog:read" }), "missing_credentials");
});

test("una firma alterada se rechaza", async () => {
  const body = JSON.stringify({ method: "webpay" });

  await expectError(authenticate(secretRequest({ body, tamper: true }), { rawBody: body }), "invalid_signature");
});

test("un cuerpo distinto al firmado se rechaza", async () => {
  const body = JSON.stringify({ method: "webpay" });

  await expectError(
    authenticate(secretRequest({ body }), { rawBody: JSON.stringify({ method: "mercadopago" }) }),
    "invalid_signature",
  );
});

test("una firma vencida se rechaza con signature_expired", async () => {
  const body = JSON.stringify({ method: "webpay" });

  await expectError(
    authenticate(secretRequest({ body, timestampHeader: String(timestamp - 3600) }), { rawBody: body }),
    "signature_expired",
  );
});

test("una clave secreta desconocida se rechaza", async () => {
  const body = JSON.stringify({ method: "webpay" });

  await expectError(authenticate(secretRequest({ body }), { rawBody: body, record: null }), "invalid_credentials");
});

test("una aplicación suspendida no puede operar", async () => {
  const body = JSON.stringify({ method: "webpay" });

  await expectError(
    authenticate(secretRequest({ body }), { rawBody: body, record: client({ status: "SUSPENDED" }) }),
    "client_suspended",
  );
});

test("una aplicación revocada no puede operar", async () => {
  const body = JSON.stringify({ method: "webpay" });

  await expectError(
    authenticate(secretRequest({ body }), { rawBody: body, record: client({ status: "REVOKED" }) }),
    "invalid_credentials",
  );
});

test("sin el scope requerido responde insufficient_scope", async () => {
  const body = JSON.stringify({ method: "webpay" });

  await expectError(
    authenticate(secretRequest({ body }), { rawBody: body, record: client({ scopes: ["catalog:read"] }) }),
    "insufficient_scope",
  );
});

function publicRequest(origin?: string) {
  return new Request("https://smartpro.cl/api/v1/catalog", {
    headers: {
      "x-smartpro-key": PUBLIC_KEY,
      ...(origin ? { origin } : {}),
    },
  });
}

test("la clave pública sirve para leer el catálogo desde un dominio autorizado", async () => {
  const context = await authenticate(publicRequest("https://desarrolloweb.cl"), { scope: "catalog:read" });

  assert.equal(context.credential, "publishable");
  assert.equal(context.origin, "https://desarrolloweb.cl");
});

test("la clave pública no sirve desde un dominio ajeno", async () => {
  await expectError(
    authenticate(publicRequest("https://atacante.cl"), { scope: "catalog:read" }),
    "origin_not_allowed",
  );
});

test("la clave pública nunca puede iniciar un pago", async () => {
  await expectError(
    authenticate(publicRequest("https://desarrolloweb.cl"), { scope: "checkout:write" }),
    "invalid_credentials",
  );
});

test("la clave pública se rechaza en endpoints que exigen clave secreta", async () => {
  await expectError(
    authenticate(publicRequest("https://desarrolloweb.cl"), { scope: "catalog:read", requireSecret: true }),
    "invalid_credentials",
  );
});

test("una lectura de catálogo servidor a servidor sin Origin se permite", async () => {
  const context = await authenticate(publicRequest(), { scope: "catalog:read" });

  assert.equal(context.credential, "publishable");
  assert.equal(context.origin, null);
});

test("un formato de clave inválido se rechaza antes de consultar la base", async () => {
  const request = new Request("https://smartpro.cl/api/v1/catalog", {
    headers: { "x-smartpro-key": "pk_live_corta" },
  });

  await expectError(authenticate(request, { scope: "catalog:read" }), "invalid_credentials");
});
