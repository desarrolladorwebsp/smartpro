import test from "node:test";
import assert from "node:assert/strict";

import { buildLiorenInvoiceEmail, calculateNetSaleAmounts, decodeLiorenInvoicePdf, getSaleReceiptValidationError, parseSaleObservation } from "./types";

test("calculateNetSaleAmounts agrega el IVA automáticamente desde el monto neto", () => {
  assert.deepEqual(calculateNetSaleAmounts(100_000), { subtotal: 100_000, tax: 19_000, total: 119_000 });
  assert.deepEqual(calculateNetSaleAmounts(0), { subtotal: 0, tax: 0, total: 0 });
  assert.deepEqual(calculateNetSaleAmounts(1.5), { subtotal: 0, tax: 0, total: 0 });
});

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

test("decodeLiorenInvoicePdf acepta solo PDFs válidos en base64", () => {
  const encoded = Buffer.from("%PDF-1.7\nFactura").toString("base64");
  assert.equal(decodeLiorenInvoicePdf(encoded)?.subarray(0, 5).toString("ascii"), "%PDF-");
  assert.equal(decodeLiorenInvoicePdf("not base64!"), null);
  assert.equal(decodeLiorenInvoicePdf(Buffer.from("texto").toString("base64")), null);
  assert.equal(decodeLiorenInvoicePdf(null), null);
});

test("buildLiorenInvoiceEmail envía al cliente y copia oculta a SmartPro con el PDF", () => {
  const email = buildLiorenInvoiceEmail({
    saleNumber: "VEN-2026-0001",
    folio: 42,
    customerEmail: "Cliente@empresa.cl",
    pdf: Buffer.from("%PDF-1.7"),
  });
  assert.equal(email.to, "cliente@empresa.cl");
  assert.equal(email.bcc, "contacto@smartpro.cl");
  assert.match(email.subject, /folio 42/);
  assert.equal(email.attachments?.[0].filename, "Factura-42.pdf");
  assert.equal(email.attachments?.[0].contentType, "application/pdf");
});
