import test from "node:test";
import assert from "node:assert/strict";

import { assessApiClientConfig, describeVisitor, publicSiteUrl, readVisitorMarkers } from "./site-health";
import type { ApiClientRecord } from "./types";

function client(overrides: Partial<ApiClientRecord> = {}): ApiClientRecord {
  return {
    id: "client-1",
    name: "Desarrollo Web",
    slug: "desarrollo-web",
    publicKey: "pk_live_example",
    secretPreview: "sk_live_…0000",
    status: "ACTIVE",
    scopes: ["catalog:read", "portfolio:read", "checkout:write", "orders:read", "sales:read", "sales:write", "leads:write"],
    allowedOrigins: ["https://desarrolloweb.smartpro.cl", "http://localhost:3100"],
    allowedReturnUrls: ["https://desarrolloweb.smartpro.cl/pago/resultado"],
    allowedServiceIds: ["servicio-1"],
    webhookUrl: "https://desarrolloweb.smartpro.cl/api/smartpro/webhook",
    rateLimitPerMinute: 120,
    contactEmail: "",
    notes: "",
    lastUsedAt: null,
    createdAt: "2026-09-22T00:00:00.000Z",
    updatedAt: "2026-09-22T00:00:00.000Z",
    ...overrides,
  };
}

test("elige el origen https público e ignora localhost", () => {
  assert.equal(
    publicSiteUrl(["http://localhost:3100", "https://desarrolloweb.smartpro.cl/"]),
    "https://desarrolloweb.smartpro.cl",
  );
  assert.equal(publicSiteUrl(["http://localhost:3100"]), null);
});

test("una credencial completa no tiene fallos de configuración", () => {
  const failed = assessApiClientConfig(client()).filter((check) => !check.ok);

  assert.deepEqual(failed, []);
});

test("marca la credencial suspendida y el webhook ausente", () => {
  const checks = assessApiClientConfig(client({ status: "SUSPENDED", webhookUrl: "" }));

  assert.equal(checks.find((check) => check.id === "status")?.ok, false);
  assert.equal(checks.find((check) => check.id === "webhook")?.ok, false);
});

test("lee los marcadores que publica la home", () => {
  assert.deepEqual(readVisitorMarkers('<main data-smartpro-plans="12" data-smartpro-projects="14">'), {
    plans: 12,
    projects: 14,
  });
});

test("una home sin sección de planes se informa como vacía", () => {
  const visitor = describeVisitor(200, "<html><body><h1>Inicio</h1></body></html>");

  assert.equal(visitor.reachable, true);
  assert.equal(visitor.plans, 0);
  assert.match(visitor.message, /no muestra la sección de planes/);
});
