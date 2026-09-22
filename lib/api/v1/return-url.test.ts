import test from "node:test";
import assert from "node:assert/strict";

import { appendCheckoutResult, isReturnUrlAllowed, isSafeReturnUrl, resolveReturnUrl } from "./return-url";

const allowed = ["https://desarrolloweb.cl/pago/resultado"];

test("solo acepta HTTPS, salvo en localhost", () => {
  assert.ok(isSafeReturnUrl("https://desarrolloweb.cl/pago"));
  assert.ok(isSafeReturnUrl("http://localhost:3000/pago"));
  assert.ok(isSafeReturnUrl("http://127.0.0.1:3000/pago"));
  assert.ok(!isSafeReturnUrl("http://desarrolloweb.cl/pago"));
  assert.ok(!isSafeReturnUrl("javascript:alert(1)"));
  assert.ok(!isSafeReturnUrl("no-es-una-url"));
});

test("acepta la URL autorizada y sus rutas hijas", () => {
  assert.ok(isReturnUrlAllowed("https://desarrolloweb.cl/pago/resultado", allowed));
  assert.ok(isReturnUrlAllowed("https://desarrolloweb.cl/pago/resultado/gracias", allowed));
  assert.ok(isReturnUrlAllowed("https://desarrolloweb.cl/pago/resultado?ref=abc", allowed));
});

test("rechaza otro dominio, otra ruta y trucos de prefijo", () => {
  assert.ok(!isReturnUrlAllowed("https://atacante.cl/pago/resultado", allowed));
  assert.ok(!isReturnUrlAllowed("https://desarrolloweb.cl/admin", allowed));
  assert.ok(!isReturnUrlAllowed("https://desarrolloweb.cl/pago/resultado-falso", allowed));
  assert.ok(!isReturnUrlAllowed("https://desarrolloweb.cl.atacante.cl/pago/resultado", allowed));
  assert.ok(!isReturnUrlAllowed("https://desarrolloweb.cl/pago/resultado", []));
});

test("una URL autorizada sin ruta cubre todo el dominio", () => {
  assert.ok(isReturnUrlAllowed("https://desarrolloweb.cl/cualquier/cosa", ["https://desarrolloweb.cl"]));
  assert.ok(!isReturnUrlAllowed("https://otro.cl/cualquier/cosa", ["https://desarrolloweb.cl"]));
});

test("sin URL solicitada se usa la primera autorizada", () => {
  assert.equal(resolveReturnUrl({ requested: null, allowed }), allowed[0]);
  assert.equal(resolveReturnUrl({ requested: "", allowed }), allowed[0]);
  assert.equal(resolveReturnUrl({ requested: null, allowed: [] }), null);
});

test("una URL solicitada no autorizada no cae al valor por defecto", () => {
  assert.equal(resolveReturnUrl({ requested: "https://atacante.cl/robo", allowed }), null);
});

test("agrega el resultado del pago a la URL de retorno", () => {
  const url = appendCheckoutResult("https://desarrolloweb.cl/pago/resultado", {
    status: "approved",
    orderId: "SP-2026-123456",
    externalReference: "pedido-1042",
  });

  const parsed = new URL(url);

  assert.equal(parsed.searchParams.get("status"), "approved");
  assert.equal(parsed.searchParams.get("orderId"), "SP-2026-123456");
  assert.equal(parsed.searchParams.get("reference"), "pedido-1042");
});

test("conserva los parámetros que ya traía la URL de retorno", () => {
  const url = appendCheckoutResult("https://desarrolloweb.cl/pago/resultado?utm=mail", { status: "failed" });
  const parsed = new URL(url);

  assert.equal(parsed.searchParams.get("utm"), "mail");
  assert.equal(parsed.searchParams.get("status"), "failed");
  assert.equal(parsed.searchParams.get("orderId"), null);
});
