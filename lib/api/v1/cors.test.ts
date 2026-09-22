import test from "node:test";
import assert from "node:assert/strict";

import { corsHeaders, isOriginAllowed, normalizeOrigin, originMatchesPattern } from "./cors";

test("normaliza el origen a esquema y host", () => {
  assert.equal(normalizeOrigin("https://Desarrolloweb.cl/"), "https://desarrolloweb.cl");
  assert.equal(normalizeOrigin("https://desarrolloweb.cl:443"), "https://desarrolloweb.cl");
  assert.equal(normalizeOrigin("http://localhost:3000"), "http://localhost:3000");
  assert.equal(normalizeOrigin("null"), null);
  assert.equal(normalizeOrigin(""), null);
  assert.equal(normalizeOrigin("no-es-una-url"), null);
});

test("compara el origen de forma exacta cuando no hay comodín", () => {
  assert.ok(originMatchesPattern("https://desarrolloweb.cl", "https://desarrolloweb.cl"));
  assert.ok(originMatchesPattern("https://desarrolloweb.cl", "https://desarrolloweb.cl/"));
  assert.ok(!originMatchesPattern("https://otro.cl", "https://desarrolloweb.cl"));
});

test("distingue el esquema", () => {
  assert.ok(!originMatchesPattern("http://desarrolloweb.cl", "https://desarrolloweb.cl"));
});

test("un subdominio no coincide con el dominio raíz sin comodín", () => {
  assert.ok(!originMatchesPattern("https://preview.desarrolloweb.cl", "https://desarrolloweb.cl"));
});

test("el comodín cubre el dominio y sus subdominios", () => {
  assert.ok(originMatchesPattern("https://preview.desarrolloweb.cl", "https://*.desarrolloweb.cl"));
  assert.ok(originMatchesPattern("https://desarrolloweb.cl", "https://*.desarrolloweb.cl"));
  assert.ok(!originMatchesPattern("https://desarrolloweb.cl.malicioso.cl", "https://*.desarrolloweb.cl"));
  assert.ok(!originMatchesPattern("http://preview.desarrolloweb.cl", "https://*.desarrolloweb.cl"));
});

test("la lista blanca acepta solo los orígenes registrados", () => {
  const allowed = ["https://desarrolloweb.cl", "https://*.negocio.cl"];

  assert.ok(isOriginAllowed("https://desarrolloweb.cl", allowed));
  assert.ok(isOriginAllowed("https://www.negocio.cl", allowed));
  assert.ok(!isOriginAllowed("https://atacante.cl", allowed));
  assert.ok(!isOriginAllowed(null, allowed));
  assert.ok(!isOriginAllowed("https://desarrolloweb.cl", []));
});

test("sin origen autorizado no se emite Access-Control-Allow-Origin", () => {
  const headers = corsHeaders(null, ["GET"]);

  assert.equal(headers["Access-Control-Allow-Origin"], undefined);
  assert.equal(headers.Vary, "Origin");
  assert.equal(headers["Access-Control-Allow-Methods"], "GET, OPTIONS");
});

test("con origen autorizado se refleja ese origen y nunca un comodín", () => {
  const headers = corsHeaders("https://desarrolloweb.cl", ["GET", "POST"]);

  assert.equal(headers["Access-Control-Allow-Origin"], "https://desarrolloweb.cl");
  assert.equal(headers["Access-Control-Allow-Methods"], "GET, POST, OPTIONS");
  assert.match(headers["Access-Control-Allow-Headers"], /x-smartpro-signature/);
  assert.match(headers["Access-Control-Allow-Headers"], /idempotency-key/);
});
