import test from "node:test";
import assert from "node:assert/strict";

import { assertQuoteConvertible, getQuoteSaleConversionCheck } from "./conversion";

test("getQuoteSaleConversionCheck bloquea duplicados, borradores y rechazadas", () => {
  assert.equal(getQuoteSaleConversionCheck("CREATED", true).convertible, false);
  assert.equal(getQuoteSaleConversionCheck("DRAFT", false).convertible, false);
  assert.equal(getQuoteSaleConversionCheck("REJECTED", false).convertible, false);
  assert.equal(getQuoteSaleConversionCheck("CREATED", false).convertible, true);
  assert.equal(getQuoteSaleConversionCheck("ACCEPTED", false).convertible, true);
});

test("la conversión automática solo admite cotizaciones aceptadas", () => {
  assert.equal(getQuoteSaleConversionCheck("SENT", false, "QUOTE_ACCEPTED").convertible, false);
  assert.equal(getQuoteSaleConversionCheck("ACCEPTED", false, "QUOTE_ACCEPTED").convertible, true);
});

test("assertQuoteConvertible lanza el mensaje comercial", () => {
  assert.throws(() => assertQuoteConvertible("CREATED", true), /ya fue convertida/);
});
