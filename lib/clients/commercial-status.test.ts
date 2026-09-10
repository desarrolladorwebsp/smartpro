import test from "node:test";
import assert from "node:assert/strict";

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
