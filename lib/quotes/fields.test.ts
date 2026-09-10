import test from "node:test";
import assert from "node:assert/strict";

import { parseDeliveryBusinessDays, parseInitialPaymentPercent, remainingPaymentPercent } from "./fields";

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
