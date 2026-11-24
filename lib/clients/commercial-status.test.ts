import test from "node:test";
import assert from "node:assert/strict";
import { historicalQuoteDestination, summarizeCrmQuotes } from "./quote-crm";

import {
  getAssignedExecutiveName,
  getClientCommercialStatusLabel,
  parseAssignedExecutiveId,
  parseClientCommercialStatus,
} from "./types";

test("parseClientCommercialStatus acepta los estados comerciales iniciales", () => {
  assert.equal(parseClientCommercialStatus("PROSPECTO"), "PROSPECTO");
  assert.equal(parseClientCommercialStatus("EN_SEGUIMIENTO"), "EN_SEGUIMIENTO");
  assert.equal(parseClientCommercialStatus("CERRADO_PERDIDO"), "CERRADO_PERDIDO");
});

test("parseClientCommercialStatus rechaza estados inválidos", () => {
  assert.throws(() => parseClientCommercialStatus("ACTIVO"), /Estado comercial inválido/);
  assert.throws(() => parseClientCommercialStatus(""), /Estado comercial inválido/);
});

test("getClientCommercialStatusLabel usa nombres comerciales", () => {
  assert.equal(getClientCommercialStatusLabel("PROSPECTO"), "Prospecto");
  assert.equal(getClientCommercialStatusLabel("EN_SEGUIMIENTO"), "En seguimiento");
  assert.equal(getClientCommercialStatusLabel("CERRADO_PERDIDO"), "Cerrado perdido");
});

test("parseAssignedExecutiveId normaliza vacío a null", () => {
  assert.equal(parseAssignedExecutiveId(null), null);
  assert.equal(parseAssignedExecutiveId(""), null);
  assert.equal(parseAssignedExecutiveId("  exec_1  "), "exec_1");
});

test("getAssignedExecutiveName muestra el responsable o Sin asignar", () => {
  assert.equal(getAssignedExecutiveName(null), "Sin asignar");
  assert.equal(
    getAssignedExecutiveName({ id: "1", firstName: "Ana", lastName: "Rojas", email: "ana@smartpro.cl" }),
    "Ana Rojas",
  );
});

test("el tablero prioriza cotizaciones enviadas vigentes, vencidas y rechazadas por cliente comercial", () => {
  const now = new Date("2026-11-24T15:00:00Z");
  const expired = new Date("2026-11-23T23:59:59Z");
  const summaries = summarizeCrmQuotes([
    { clientId: "contacto1", businessId: "empresa1", status: "REJECTED", validUntil: null },
    { clientId: "contacto2", businessId: "empresa1", status: "SENT", validUntil: expired },
    { clientId: "contacto3", businessId: "empresa1", status: "SENT", validUntil: null },
    { clientId: "persona1", businessId: null, status: "SENT", validUntil: expired },
    { clientId: "persona1", businessId: null, status: "REJECTED", validUntil: null },
    { clientId: "persona2", businessId: null, status: "REJECTED", validUntil: null },
    { clientId: "persona3", businessId: null, status: "CREATED", validUntil: expired },
  ], now);

  assert.equal(summaries.get("business:empresa1")?.indicator, "CURRENT");
  assert.equal(summaries.get("person:persona1")?.indicator, "EXPIRED");
  assert.equal(summaries.get("person:persona2")?.indicator, "REJECTED");
  assert.equal(summaries.get("person:persona3")?.indicator, undefined);
  assert.equal(summaries.has("person:contacto1"), false);
});

test("la regularización mueve nuevos con cotización finalizada y rechazos sin otra propuesta finalizada", () => {
  const summaries = summarizeCrmQuotes([
    { clientId: "borrador", businessId: null, status: "DRAFT", validUntil: null },
    { clientId: "creada", businessId: null, status: "CREATED", validUntil: null },
    { clientId: "rechazada", businessId: null, status: "REJECTED", validUntil: null },
    { clientId: "ambas", businessId: null, status: "REJECTED", validUntil: null },
    { clientId: "ambas", businessId: null, status: "SENT", validUntil: new Date("2026-11-23") },
  ]);

  assert.equal(historicalQuoteDestination("NEW", summaries.get("person:borrador")), undefined);
  assert.equal(historicalQuoteDestination("NEW", summaries.get("person:creada")), "QUOTED");
  assert.equal(historicalQuoteDestination("CONTACTED", summaries.get("person:creada")), undefined);
  assert.equal(historicalQuoteDestination("QUOTED", summaries.get("person:rechazada")), "PROPOSAL_REJECTED");
  assert.equal(historicalQuoteDestination("NEGOTIATION", summaries.get("person:rechazada")), undefined);
  assert.equal(historicalQuoteDestination("NEW", summaries.get("person:ambas")), "QUOTED");
  assert.equal(historicalQuoteDestination("QUOTED", summaries.get("person:ambas")), undefined);
});
