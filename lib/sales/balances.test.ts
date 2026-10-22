import test from "node:test";
import assert from "node:assert/strict";

import { getBalanceDue, getCollectionStatus, parseSalePaymentAmount, sumPaidAmount } from "./balances";
import { parseSaleClpInput } from "./amounts";

test("sumPaidAmount y saldo derivado", () => {
  assert.equal(sumPaidAmount([]), 0);
  assert.equal(sumPaidAmount([{ amount: 50000 }, { amount: 19000 }]), 69000);
  assert.equal(getBalanceDue(119000, 59500), 59500);
  assert.equal(getBalanceDue(100, 150), 0);
});

test("collectionStatus cubre pendiente, parcial y pagada", () => {
  assert.equal(getCollectionStatus(119000, 0), "UNPAID");
  assert.equal(getCollectionStatus(119000, 59500), "PARTIAL");
  assert.equal(getCollectionStatus(119000, 119000), "PAID");
});

test("parseSalePaymentAmount rechaza montos sobre el saldo", () => {
  assert.equal(parseSalePaymentAmount("0", 100), 0);
  assert.equal(parseSalePaymentAmount("50.000", 100000), 50000);
  assert.throws(() => parseSalePaymentAmount("200", 100), /saldo pendiente/);
  assert.throws(() => parseSalePaymentAmount(-1, 100), /número válido/);
});

test("acepta el pago completo mostrado en CLP aunque la cotización incluya centavos", () => {
  assert.equal(parseSalePaymentAmount("49433", 49432.6), 49433);
  assert.equal(parseSalePaymentAmount("49.433", 49432.6), 49433);
  assert.equal(getBalanceDue(49432.6, 49433), 0);
  assert.equal(getCollectionStatus(49432.6, 49433), "PAID");
  assert.throws(() => parseSalePaymentAmount("49.434", 49432.6), /saldo pendiente/);
});

test("interpreta el mismo monto CLP en el formulario y en el servidor", () => {
  for (const value of [49433, "49433", "49.433", "$ 49.433", "49.433,00"]) {
    assert.equal(parseSaleClpInput(value), 49433);
  }
  for (const value of ["abc", "$", "49.43", "-1", -1, "1e5", "NaN", "1,5", 1.5, Infinity, null]) {
    assert.ok(Number.isNaN(parseSaleClpInput(value)), String(value));
    assert.throws(() => parseSalePaymentAmount(value, 100000), /número válido/);
  }
  assert.equal(parseSaleClpInput(""), 0);
});
