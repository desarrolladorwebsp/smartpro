import test from "node:test";
import assert from "node:assert/strict";

import { SMARTPRO_BANK, SMARTPRO_OFFICES } from "./company";
import { formatQuotePaymentMethodsText, getQuotePaymentMethods } from "./payment-methods";

test("los medios de pago incluyen efectivo, transferencia y tarjetas", () => {
  const titles = getQuotePaymentMethods().map((method) => method.title).join(" ");
  assert.match(titles, /Efectivo/);
  assert.match(titles, /Transferencia bancaria/);
  assert.match(titles, /Tarjeta de crédito/);
  assert.match(titles, /Tarjeta de débito/);
  assert.match(formatQuotePaymentMethodsText(), /Transferencia bancaria/);
});

test("los datos bancarios y oficinas son configurables", () => {
  assert.equal(SMARTPRO_BANK.bank, "Banco BCI");
  assert.equal(SMARTPRO_BANK.accountNumber, "97610224");
  assert.equal(SMARTPRO_BANK.rut, "78.206.607-2");
  assert.ok(SMARTPRO_OFFICES.includes("Santa Elena 941 B, Santiago"));
  assert.ok(SMARTPRO_OFFICES.includes("Vicuña Mackenna 920, of. 726, Ñuñoa"));
});
