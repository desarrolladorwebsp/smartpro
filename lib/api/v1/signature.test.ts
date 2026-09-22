import test from "node:test";
import assert from "node:assert/strict";

import {
  buildSignaturePayload,
  canonicalRequestPath,
  isTimestampFresh,
  parseSignatureHeader,
  parseTimestampHeader,
  signRequest,
  signWebhookPayload,
  verifyRequestSignature,
} from "./signature";

const secret = "sk_live_secreto-de-prueba";
const body = JSON.stringify({ method: "webpay", items: [{ planId: "plan-1" }] });
const nowMs = 1_760_000_000_000;
const timestamp = Math.floor(nowMs / 1000);

function signed(overrides: Partial<Parameters<typeof verifyRequestSignature>[0]> = {}) {
  return verifyRequestSignature({
    secret,
    method: "POST",
    path: "/api/v1/checkout/sessions",
    body,
    signatureHeader: signRequest({ secret, timestamp, method: "POST", path: "/api/v1/checkout/sessions", body }),
    timestampHeader: String(timestamp),
    nowMs,
    ...overrides,
  });
}

test("una solicitud bien firmada se acepta", () => {
  assert.deepEqual(signed(), { ok: true });
});

test("el payload firmado incluye versión, método, ruta y hash del cuerpo", () => {
  const payload = buildSignaturePayload({ timestamp, method: "post", path: "/api/v1/sales", body: "{}" });
  const lines = payload.split("\n");

  assert.equal(lines[0], "v1");
  assert.equal(lines[1], String(timestamp));
  assert.equal(lines[2], "POST");
  assert.equal(lines[3], "/api/v1/sales");
  assert.equal(lines[4].length, 64);
});

test("cambiar el cuerpo invalida la firma", () => {
  const result = signed({ body: JSON.stringify({ method: "webpay", items: [{ planId: "plan-999" }] }) });

  assert.deepEqual(result, { ok: false, reason: "mismatch" });
});

test("cambiar la ruta invalida la firma", () => {
  assert.deepEqual(signed({ path: "/api/v1/sales" }), { ok: false, reason: "mismatch" });
});

test("cambiar el método invalida la firma", () => {
  assert.deepEqual(signed({ method: "GET" }), { ok: false, reason: "mismatch" });
});

test("otro secreto invalida la firma", () => {
  assert.deepEqual(signed({ secret: "sk_live_otro" }), { ok: false, reason: "mismatch" });
});

test("una firma antigua se rechaza por expiración", () => {
  assert.deepEqual(signed({ nowMs: nowMs + 600_000 }), { ok: false, reason: "expired" });
});

test("una firma del futuro también se rechaza", () => {
  assert.deepEqual(signed({ nowMs: nowMs - 600_000 }), { ok: false, reason: "expired" });
});

test("acepta desviaciones de reloj dentro de la tolerancia", () => {
  assert.deepEqual(signed({ nowMs: nowMs + 120_000 }), { ok: true });
});

test("informa cuando faltan las cabeceras", () => {
  assert.deepEqual(signed({ signatureHeader: null }), { ok: false, reason: "missing_signature" });
  assert.deepEqual(signed({ timestampHeader: null }), { ok: false, reason: "missing_timestamp" });
  assert.deepEqual(signed({ timestampHeader: "no-es-numero" }), { ok: false, reason: "missing_timestamp" });
});

test("acepta marcas de tiempo en milisegundos", () => {
  const msTimestamp = String(nowMs);
  const result = verifyRequestSignature({
    secret,
    method: "POST",
    path: "/api/v1/checkout/sessions",
    body,
    signatureHeader: signRequest({
      secret,
      timestamp,
      method: "POST",
      path: "/api/v1/checkout/sessions",
      body,
    }),
    timestampHeader: msTimestamp,
    nowMs,
  });

  assert.deepEqual(result, { ok: true });
});

test("parsea la cabecera de firma y descarta versiones desconocidas", () => {
  assert.equal(parseSignatureHeader("v1=abc123"), "abc123");
  assert.equal(parseSignatureHeader("v0=viejo,v1=nuevo"), "nuevo");
  assert.equal(parseSignatureHeader("v2=futuro"), null);
  assert.equal(parseSignatureHeader(""), null);
});

test("parsea marcas de tiempo en segundos y milisegundos", () => {
  assert.equal(parseTimestampHeader("1760000000"), 1_760_000_000);
  assert.equal(parseTimestampHeader("1760000000000"), 1_760_000_000);
  assert.equal(parseTimestampHeader("-5"), null);
  assert.equal(parseTimestampHeader("abc"), null);
});

test("la frescura se mide contra la tolerancia indicada", () => {
  assert.ok(isTimestampFresh(timestamp, nowMs, 300));
  assert.ok(!isTimestampFresh(timestamp, nowMs + 301_000, 300));
});

test("la ruta canónica conserva la query string", () => {
  assert.equal(canonicalRequestPath("https://smartpro.cl/api/v1/plans?service=web"), "/api/v1/plans?service=web");
  assert.equal(canonicalRequestPath("https://smartpro.cl/api/v1/plans"), "/api/v1/plans");
});

test("la firma de webhooks depende del cuerpo y del instante", () => {
  const first = signWebhookPayload({ secret, timestamp, body: '{"event":"checkout.paid"}' });

  assert.equal(first, signWebhookPayload({ secret, timestamp, body: '{"event":"checkout.paid"}' }));
  assert.notEqual(first, signWebhookPayload({ secret, timestamp, body: '{"event":"checkout.failed"}' }));
  assert.notEqual(first, signWebhookPayload({ secret, timestamp: timestamp + 1, body: '{"event":"checkout.paid"}' }));
  assert.match(first, /^v1=[0-9a-f]{64}$/);
});
