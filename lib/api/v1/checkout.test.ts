import test from "node:test";
import assert from "node:assert/strict";

import { parseCheckoutCustomer, parseCheckoutItems, parseCheckoutRequest } from "./checkout";
import { isApiError } from "./errors";
import type { ApiClientRecord } from "./types";

const client = {
  id: "api-client-1",
  slug: "desarrollo-web",
  allowedReturnUrls: ["https://desarrolloweb.cl/pago/resultado"],
} as ApiClientRecord;

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    method: "webpay",
    returnUrl: "https://desarrolloweb.cl/pago/resultado",
    customer: { name: "Ana Pérez", email: "Ana@Empresa.cl", phone: "+56 9 1234 5678" },
    items: [{ planId: "plan-1", quantity: 2 }],
    ...overrides,
  };
}

function rejects(run: () => unknown, code = "validation_failed") {
  assert.throws(run, (error: unknown) => {
    assert.ok(isApiError(error), "se esperaba un ApiError");
    assert.equal(error.code, code);
    return true;
  });
}

test("normaliza el correo y conserva el resto del contacto", () => {
  const customer = parseCheckoutCustomer({
    name: "  Ana Pérez  ",
    email: "Ana@Empresa.CL",
    phone: "+56912345678",
    company: "Empresa SpA",
  });

  assert.deepEqual(customer, {
    name: "Ana Pérez",
    email: "ana@empresa.cl",
    phone: "+56912345678",
    company: "Empresa SpA",
  });
});

test("exige nombre, correo válido y teléfono con ocho dígitos", () => {
  rejects(() => parseCheckoutCustomer(null));
  rejects(() => parseCheckoutCustomer({ email: "ana@empresa.cl", phone: "+56912345678" }));
  rejects(() => parseCheckoutCustomer({ name: "Ana", email: "ana(arroba)empresa.cl", phone: "+56912345678" }));
  rejects(() => parseCheckoutCustomer({ name: "Ana", email: "ana@empresa.cl", phone: "1234" }));
});

test("la cantidad por defecto es uno", () => {
  assert.deepEqual(parseCheckoutItems([{ planId: "plan-1" }]), [{ planId: "plan-1", quantity: 1 }]);
});

test("rechaza carros vacíos, cantidades inválidas y planes sin id", () => {
  rejects(() => parseCheckoutItems([]));
  rejects(() => parseCheckoutItems("plan-1"));
  rejects(() => parseCheckoutItems([{ planId: "" }]));
  rejects(() => parseCheckoutItems([{ planId: "plan-1", quantity: 0 }]));
  rejects(() => parseCheckoutItems([{ planId: "plan-1", quantity: 1.5 }]));
  rejects(() => parseCheckoutItems([{ planId: "plan-1", quantity: 100 }]));
});

test("limita la cantidad de líneas del carro", () => {
  const items = Array.from({ length: 21 }, () => ({ planId: "plan-1" }));

  rejects(() => parseCheckoutItems(items));
});

test("acepta una solicitud completa", () => {
  const parsed = parseCheckoutRequest(validBody({ externalReference: "pedido-1042" }), client);

  assert.equal(parsed.method, "webpay");
  assert.equal(parsed.returnUrl, "https://desarrolloweb.cl/pago/resultado");
  assert.equal(parsed.externalReference, "pedido-1042");
  assert.deepEqual(parsed.items, [{ planId: "plan-1", quantity: 2 }]);
});

test("solo acepta los medios de pago soportados", () => {
  rejects(() => parseCheckoutRequest(validBody({ method: "paypal" }), client));
  rejects(() => parseCheckoutRequest(validBody({ method: undefined }), client));
});

test("una returnUrl no autorizada detiene el pago", () => {
  rejects(() => parseCheckoutRequest(validBody({ returnUrl: "https://atacante.cl/robo" }), client));
});

test("sin returnUrl se usa la primera autorizada", () => {
  const parsed = parseCheckoutRequest(validBody({ returnUrl: undefined }), client);

  assert.equal(parsed.returnUrl, "https://desarrolloweb.cl/pago/resultado");
});

test("la referencia externa se recorta a 191 caracteres", () => {
  const parsed = parseCheckoutRequest(validBody({ externalReference: "x".repeat(300) }), client);

  assert.equal(parsed.externalReference.length, 191);
});

test("el cuerpo no puede fijar el precio", () => {
  const parsed = parseCheckoutRequest(
    validBody({ items: [{ planId: "plan-1", quantity: 1, unitPrice: 1, total: 1 }] }),
    client,
  );

  assert.deepEqual(parsed.items, [{ planId: "plan-1", quantity: 1 }]);
});
