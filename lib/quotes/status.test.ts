import test from "node:test";
import assert from "node:assert/strict";

import { assertQuoteStatusTransition, canPayQuote, canSendQuote, canTransitionQuoteStatus, isQuoteExpired } from "./status";

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

test("canPayQuote permite cobro de cotizaciones vigentes y no de borradores o rechazadas", () => {
  assert.equal(canPayQuote("CREATED"), true);
  assert.equal(canPayQuote("SENT"), true);
  assert.equal(canPayQuote("ACCEPTED"), true);
  assert.equal(canPayQuote("DRAFT"), false);
  assert.equal(canPayQuote("REJECTED"), false);
});

test("isQuoteExpired usa la fecha de vencimiento de la cotización", () => {
  assert.equal(isQuoteExpired(null), false);
  assert.equal(isQuoteExpired("2020-01-01T00:00:00.000Z"), true);
  assert.equal(isQuoteExpired("2099-01-01T00:00:00.000Z"), false);
});

test("assertQuoteStatusTransition lanza si el cambio no es válido", () => {
  assert.throws(() => assertQuoteStatusTransition("ACCEPTED", "DRAFT"), /no está permitido/);
});
