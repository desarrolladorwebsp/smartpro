import test from "node:test";
import assert from "node:assert/strict";

import { parseClientRegistration } from "./validation";

test("parseClientRegistration exige los campos obligatorios sin RUT", () => {
  const result = parseClientRegistration({
    firstName: "Ana",
    lastName: "",
    email: "ana@smartpro.cl",
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error, "Completa los campos obligatorios.");
  }
});

test("parseClientRegistration acepta registro sin RUT y no lo valida", () => {
  const result = parseClientRegistration({
    firstName: "Ana",
    lastName: "García",
    businessName: "SmartPro Studio",
    rut: "",
    email: "Ana@SmartPro.cl",
    phone: "+56 9 1234 5678",
    password: "secret123",
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.email, "ana@smartpro.cl");
    assert.equal(result.data.rut, "");
  }
});

test("parseClientRegistration no rechaza un RUT con dígito verificador inválido", () => {
  const result = parseClientRegistration({
    firstName: "Ana",
    lastName: "García",
    businessName: "SmartPro Studio",
    rut: "12.345.678-9",
    email: "ana@smartpro.cl",
    phone: "+56 9 1234 5678",
    password: "secret123",
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.rut, "12345678-9");
  }
});

test("parseClientRegistration normaliza email y RUT cuando se informa", () => {
  const result = parseClientRegistration({
    firstName: "Ana",
    lastName: "García",
    businessName: "SmartPro Studio",
    rut: "12.345.678-9",
    email: "Ana@SmartPro.cl",
    phone: "+56 9 1234 5678",
    password: "secret123",
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.email, "ana@smartpro.cl");
    assert.equal(result.data.rut, "12345678-9");
  }
});
