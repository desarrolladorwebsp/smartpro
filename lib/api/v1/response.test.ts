import test from "node:test";
import assert from "node:assert/strict";

import { ApiError, apiErrorStatus, isApiError } from "./errors";
import { buildRequestHash, normalizeIdempotencyKey } from "./idempotency";
import { buildErrorEnvelope, buildSuccessEnvelope, toApiError } from "./response";

test("cada código de error tiene su estado HTTP", () => {
  assert.equal(apiErrorStatus("validation_failed"), 422);
  assert.equal(apiErrorStatus("invalid_signature"), 401);
  assert.equal(apiErrorStatus("insufficient_scope"), 403);
  assert.equal(apiErrorStatus("rate_limited"), 429);
  assert.equal(new ApiError("resource_not_found", "No existe.").status, 404);
});

test("el sobre de éxito incluye el identificador de la solicitud", () => {
  const envelope = buildSuccessEnvelope({ ok: true }, { requestId: "req-1" });

  assert.deepEqual(envelope, { data: { ok: true }, meta: { requestId: "req-1", apiVersion: "v1" } });
});

test("las listas informan el total en meta.count", () => {
  const envelope = buildSuccessEnvelope([1, 2, 3], { requestId: "req-1", count: 3 });

  assert.equal(envelope.meta.count, 3);
});

test("el sobre de error omite details cuando no hay", () => {
  const envelope = buildErrorEnvelope("validation_failed", "Falta el correo.", "req-1");

  assert.deepEqual(envelope.error, { code: "validation_failed", message: "Falta el correo." });
  assert.equal("details" in envelope.error, false);
});

test("un ApiError se devuelve tal cual", () => {
  const original = new ApiError("validation_failed", "Falta el correo.", { field: "email" });
  const translated = toApiError(original);

  assert.equal(translated, original);
  assert.ok(isApiError(translated));
});

test("una caída de la base no filtra detalles internos", () => {
  const translated = toApiError(new Error("No hay conexión a la base de datos."));

  assert.equal(translated.code, "service_unavailable");
  assert.equal(translated.status, 503);
  assert.ok(!translated.message.includes("base de datos."));
});

test("cualquier otra excepción se convierte en error interno genérico", () => {
  const translated = toApiError(new Error("Table `Order` doesn't exist"));

  assert.equal(translated.code, "internal_error");
  assert.ok(!translated.message.includes("Order"));
});

test("la clave de idempotencia es obligatoria y acotada", () => {
  assert.equal(normalizeIdempotencyKey(" pedido-1042 "), "pedido-1042");
  assert.throws(() => normalizeIdempotencyKey(""), /Idempotency-Key/);
  assert.throws(() => normalizeIdempotencyKey("x".repeat(201)), /200 caracteres/);
});

test("el hash del pedido distingue cuerpo, ruta y método", () => {
  const base = buildRequestHash("POST", "/api/v1/sales", '{"net":1000}');

  assert.equal(base, buildRequestHash("post", "/api/v1/sales", '{"net":1000}'));
  assert.notEqual(base, buildRequestHash("POST", "/api/v1/sales", '{"net":2000}'));
  assert.notEqual(base, buildRequestHash("POST", "/api/v1/leads", '{"net":1000}'));
});
