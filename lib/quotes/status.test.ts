import test from "node:test";
import assert from "node:assert/strict";

import { assertQuoteStatusTransition, canSendQuote, canTransitionQuoteStatus } from "./status";

test("permite las transiciones de estado comerciales", () => {
  assert.equal(canTransitionQuoteStatus("DRAFT", "CREATED"), true);
  assert.equal(canTransitionQuoteStatus("DRAFT", "SENT"), true);
  assert.equal(canTransitionQuoteStatus("CREATED", "SENT"), true);
  assert.equal(canTransitionQuoteStatus("CREATED", "ACCEPTED"), true);
  assert.equal(canTransitionQuoteStatus("SENT", "REJECTED"), true);
  assert.equal(canTransitionQuoteStatus("ACCEPTED", "SENT"), false);
  assert.equal(canTransitionQuoteStatus("REJECTED", "DRAFT"), false);
});

test("canSendQuote cubre borrador, creada y reenvío, no estados terminales", () => {
  assert.equal(canSendQuote("DRAFT"), true);
  assert.equal(canSendQuote("CREATED"), true);
  assert.equal(canSendQuote("SENT"), true);
  assert.equal(canSendQuote("ACCEPTED"), false);
  assert.equal(canSendQuote("REJECTED"), false);
});

test("assertQuoteStatusTransition lanza si el cambio no es válido", () => {
  assert.throws(() => assertQuoteStatusTransition("ACCEPTED", "DRAFT"), /no está permitido/);
});
