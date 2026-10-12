import test from "node:test";
import assert from "node:assert/strict";

import { parseDeliveryBusinessDays, parseInitialPaymentPercent, quoteDepositAmounts, remainingPaymentPercent } from "./fields";

test("parseDeliveryBusinessDays valida el rango de días hábiles", () => {
  assert.equal(parseDeliveryBusinessDays("15"), 15);
  assert.throws(() => parseDeliveryBusinessDays(0), /días hábiles/);
  assert.throws(() => parseDeliveryBusinessDays(400), /días hábiles/);
});

test("parseInitialPaymentPercent valida el rango 1-100", () => {
  assert.equal(parseInitialPaymentPercent("50"), 50);
  assert.equal(parseInitialPaymentPercent(100), 100);
  assert.throws(() => parseInitialPaymentPercent(0), /1% y 100%/);
  assert.throws(() => parseInitialPaymentPercent(101), /1% y 100%/);
});

test("remainingPaymentPercent calcula el saldo", () => {
  assert.equal(remainingPaymentPercent(50), 50);
  assert.equal(remainingPaymentPercent(100), 0);
});

test("quoteDepositAmounts calcula el abono en pesos", () => {
  const deposit = quoteDepositAmounts({ subtotal: 100000, tax: 19000, total: 119000, initialPaymentPercent: 50 });
  assert.equal(deposit.total, 59500);
  assert.equal(deposit.subtotal, 50000);
  assert.equal(deposit.tax, 9500);
  assert.equal(deposit.isFull, false);

  const full = quoteDepositAmounts({ subtotal: 100000, tax: 19000, total: 119000, initialPaymentPercent: 100 });
  assert.equal(full.total, 119000);
  assert.equal(full.isFull, true);
});
