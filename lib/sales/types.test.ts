import test from "node:test";
import assert from "node:assert/strict";

import { getSaleReceiptValidationError, parseSaleObservation } from "./types";

test("parseSaleObservation recorta y limita el largo", () => {
  assert.equal(parseSaleObservation("  pago transferido  "), "pago transferido");
  assert.throws(() => parseSaleObservation("x".repeat(2001)), /2000 caracteres/);
});

test("getSaleReceiptValidationError permite omitir el archivo y valida tipo/peso", () => {
  assert.equal(getSaleReceiptValidationError(null), null);
  assert.equal(getSaleReceiptValidationError({ size: 1024, type: "application/pdf" }), null);
  assert.match(String(getSaleReceiptValidationError({ size: 6 * 1024 * 1024, type: "application/pdf" })), /5 MB/);
  assert.match(String(getSaleReceiptValidationError({ size: 1024, type: "text/plain" })), /Formato no permitido/);
});
