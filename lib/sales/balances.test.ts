import test from "node:test";
import assert from "node:assert/strict";

import { getBalanceDue, getCollectionStatus, parseSalePaymentAmount, sumPaidAmount } from "./balances";

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
