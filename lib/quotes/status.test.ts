import test from "node:test";
import assert from "node:assert/strict";

import {
  assertQuoteStatusTransition,
  canEditQuote,
  canPayQuote,
  canSendQuote,
  canSetQuoteStatusManually,
  canTransitionQuoteStatus,
  isQuoteExpired,
  nextQuoteStatusAfterEdit,
} from "./status";

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

test("canEditQuote permite ajustar borradores, creadas y enviadas, no estados terminales", () => {
  assert.equal(canEditQuote("DRAFT"), true);
  assert.equal(canEditQuote("CREATED"), true);
  assert.equal(canEditQuote("SENT"), true);
  assert.equal(canEditQuote("ACCEPTED"), false);
  assert.equal(canEditQuote("REJECTED"), false);
});

test("el estado Enviada solo se aplica al confirmar el envío por correo", () => {
  assert.equal(canSetQuoteStatusManually("SENT"), false);
  assert.equal(canSetQuoteStatusManually("CREATED"), true);
  assert.equal(canSetQuoteStatusManually("ACCEPTED"), true);
});

test("editar una cotización enviada la deja creada para volver a confirmar el envío", () => {
  assert.equal(nextQuoteStatusAfterEdit("DRAFT", "DRAFT"), "DRAFT");
  assert.equal(nextQuoteStatusAfterEdit("DRAFT", "CREATED"), "CREATED");
  assert.equal(nextQuoteStatusAfterEdit("CREATED"), "CREATED");
  assert.equal(nextQuoteStatusAfterEdit("SENT"), "CREATED");
  assert.throws(() => nextQuoteStatusAfterEdit("ACCEPTED"), /ya no se puede modificar/);
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
