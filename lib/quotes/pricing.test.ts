import test from "node:test";
import assert from "node:assert/strict";

import { applyQuoteDiscount, formatQuoteDiscountLabel, parseQuoteDiscount } from "./pricing";

test("parseQuoteDiscount acepta porcentaje, monto en CLP y vacío", () => {
  assert.deepEqual(parseQuoteDiscount({}), { type: "NONE", value: 0 });
  assert.deepEqual(parseQuoteDiscount({ type: "PERCENT", value: "10" }), { type: "PERCENT", value: 10 });
  assert.deepEqual(parseQuoteDiscount({ type: "AMOUNT", value: "20.000" }), { type: "AMOUNT", value: 20000 });
  assert.deepEqual(parseQuoteDiscount({ type: "PERCENT", value: 0 }), { type: "NONE", value: 0 });
  assert.throws(() => parseQuoteDiscount({ type: "PERCENT", value: 120 }), /porcentaje/);
  assert.throws(() => parseQuoteDiscount({ type: "AMOUNT", value: -1 }), /pesos/);
});

test("applyQuoteDiscount reduce el neto y el IVA en la misma proporción", () => {
  const priced = applyQuoteDiscount({ subtotal: 100000, tax: 19000, total: 119000 }, { type: "PERCENT", value: 10 });
  assert.equal(priced.discountAmount, 10000);
  assert.equal(priced.subtotal, 90000);
  assert.equal(priced.tax, 17100);
  assert.equal(priced.total, 107100);
  assert.equal(formatQuoteDiscountLabel(priced), "Descuento (10%)");

  const amount = applyQuoteDiscount({ subtotal: 100000, tax: 19000, total: 119000 }, { type: "AMOUNT", value: 20000 });
  assert.equal(amount.discountAmount, 20000);
  assert.equal(amount.subtotal, 80000);
  assert.equal(amount.tax, 15200);
  assert.equal(amount.total, 95200);
});

test("applyQuoteDiscount no permite descontar más que el subtotal", () => {
  assert.throws(
    () => applyQuoteDiscount({ subtotal: 100000, tax: 19000, total: 119000 }, { type: "AMOUNT", value: 100001 }),
    /mayor al subtotal/,
  );
});
