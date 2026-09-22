import test from "node:test";
import assert from "node:assert/strict";

import { parseContactInput, splitFullName } from "./clients";
import { isApiError } from "./errors";
import { parseAmounts, parseExternalSalePaymentMethod, parseSoldAt } from "./sales";

function rejects(run: () => unknown, code = "validation_failed") {
  assert.throws(run, (error: unknown) => {
    assert.ok(isApiError(error), "se esperaba un ApiError");
    assert.equal(error.code, code);
    return true;
  });
}

test("solo admite medios de pago fuera de línea", () => {
  assert.equal(parseExternalSalePaymentMethod("transfer"), "transfer");
  assert.equal(parseExternalSalePaymentMethod("CASH"), "cash");
  assert.equal(parseExternalSalePaymentMethod(" other "), "other");
});

test("los pagos en línea no se registran a mano", () => {
  rejects(() => parseExternalSalePaymentMethod("transbank"));
  rejects(() => parseExternalSalePaymentMethod("mercadopago"));
  rejects(() => parseExternalSalePaymentMethod(""));
  rejects(() => parseExternalSalePaymentMethod(undefined));
});

test("sin fecha la venta queda con el instante actual", () => {
  const now = new Date("2026-03-12T15:00:00.000Z");

  assert.equal(parseSoldAt(null, now).toISOString(), now.toISOString());
  assert.equal(parseSoldAt("2026-03-10T12:00:00.000Z", now).toISOString(), "2026-03-10T12:00:00.000Z");
});

test("rechaza fechas inválidas o futuras", () => {
  const now = new Date("2026-03-12T15:00:00.000Z");

  rejects(() => parseSoldAt("ayer", now));
  rejects(() => parseSoldAt("2026-03-13T15:00:00.000Z", now));
});

test("el IVA se calcula al 19% cuando no viene", () => {
  assert.deepEqual(parseAmounts({ net: 890_000 }), { subtotal: 890_000, tax: 169_100, total: 1_059_100 });
});

test("respeta el IVA informado, incluso exento", () => {
  assert.deepEqual(parseAmounts({ net: 100_000, tax: 0 }), { subtotal: 100_000, tax: 0, total: 100_000 });
  assert.deepEqual(parseAmounts({ net: 100_000, tax: 5_000 }), { subtotal: 100_000, tax: 5_000, total: 105_000 });
});

test("rechaza montos ausentes, cero o negativos", () => {
  rejects(() => parseAmounts(null));
  rejects(() => parseAmounts({}));
  rejects(() => parseAmounts({ net: 0 }));
  rejects(() => parseAmounts({ net: -1000 }));
  rejects(() => parseAmounts({ net: "mucho" }));
  rejects(() => parseAmounts({ net: 1000, tax: -1 }));
});

test("divide el nombre completo en nombre y apellido", () => {
  assert.deepEqual(splitFullName("Ana Pérez"), { firstName: "Ana", lastName: "Pérez" });
  assert.deepEqual(splitFullName("Ana María Pérez Soto"), { firstName: "Ana", lastName: "María Pérez Soto" });
  assert.deepEqual(splitFullName("Ana"), { firstName: "Ana", lastName: "Ana" });
});

test("acepta el contacto con un solo campo de nombre", () => {
  const contact = parseContactInput({ contactName: "Ana Pérez", email: "Ana@Empresa.cl" });

  assert.equal(contact.contactFirstName, "Ana");
  assert.equal(contact.contactLastName, "Pérez");
  assert.equal(contact.email, "ana@empresa.cl");
  assert.equal(contact.companyName, "Ana", "sin empresa se usa el nombre del contacto");
});

test("acepta nombre y apellido por separado", () => {
  const contact = parseContactInput({
    contactFirstName: "Ana",
    contactLastName: "Pérez",
    companyName: "Empresa SpA",
    email: "ana@empresa.cl",
    phone: "+56912345678",
  });

  assert.equal(contact.companyName, "Empresa SpA");
  assert.equal(contact.contactLastName, "Pérez");
  assert.equal(contact.phone, "+56912345678");
});

test("exige correo válido y nombre de contacto", () => {
  rejects(() => parseContactInput(null));
  rejects(() => parseContactInput({ contactName: "Ana" }));
  rejects(() => parseContactInput({ contactName: "Ana", email: "ana@" }));
  rejects(() => parseContactInput({ email: "ana@empresa.cl" }));
});

test("el mensaje del formulario llega como nota", () => {
  const contact = parseContactInput({
    name: "Ana Pérez",
    email: "ana@empresa.cl",
    message: "Necesito   renovar mi sitio.",
  });

  assert.equal(contact.notes, "Necesito renovar mi sitio.");
});
