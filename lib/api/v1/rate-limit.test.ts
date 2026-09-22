import test from "node:test";
import assert from "node:assert/strict";

import { consumeRateLimit, rateLimitHeaders, type RateLimitStore } from "./rate-limit";

function store(): RateLimitStore {
  return new Map();
}

test("permite hasta el límite y luego bloquea", () => {
  const shared = store();
  const now = 1_000_000;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = consumeRateLimit("cliente", 3, { now, store: shared });
    assert.equal(result.allowed, true, `intento ${attempt}`);
    assert.equal(result.remaining, 3 - attempt);
  }

  const blocked = consumeRateLimit("cliente", 3, { now, store: shared });

  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
});

test("la ventana se reinicia al vencer", () => {
  const shared = store();
  const now = 1_000_000;

  consumeRateLimit("cliente", 1, { now, store: shared });
  assert.equal(consumeRateLimit("cliente", 1, { now, store: shared }).allowed, false);
  assert.equal(consumeRateLimit("cliente", 1, { now: now + 60_001, store: shared }).allowed, true);
});

test("cada clave lleva su propia cuenta", () => {
  const shared = store();
  const now = 1_000_000;

  consumeRateLimit("cliente-a", 1, { now, store: shared });

  assert.equal(consumeRateLimit("cliente-a", 1, { now, store: shared }).allowed, false);
  assert.equal(consumeRateLimit("cliente-b", 1, { now, store: shared }).allowed, true);
});

test("un límite inválido no deja la API abierta ni cerrada", () => {
  const shared = store();
  const result = consumeRateLimit("cliente", 0, { now: 1_000_000, store: shared });

  assert.equal(result.limit, 1);
  assert.equal(result.allowed, true);
  assert.equal(consumeRateLimit("cliente", 0, { now: 1_000_000, store: shared }).allowed, false);
});

test("las cabeceras informan el límite y solo traen Retry-After al bloquear", () => {
  const shared = store();
  const now = 1_000_000;

  const allowed = rateLimitHeaders(consumeRateLimit("cliente", 2, { now, store: shared }), now);
  assert.equal(allowed["X-RateLimit-Limit"], "2");
  assert.equal(allowed["X-RateLimit-Remaining"], "1");
  assert.equal(allowed["Retry-After"], undefined);

  consumeRateLimit("cliente", 2, { now, store: shared });
  const blocked = rateLimitHeaders(consumeRateLimit("cliente", 2, { now, store: shared }), now);

  assert.equal(blocked["X-RateLimit-Remaining"], "0");
  assert.equal(blocked["Retry-After"], "60");
});
