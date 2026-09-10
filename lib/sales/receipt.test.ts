import test from "node:test";
import assert from "node:assert/strict";

import { SALE_RECEIPT_UPLOAD_DIR, isManagedSaleReceiptPath, validateSaleReceiptUpload } from "./receipt";

test("validateSaleReceiptUpload acepta PDF e imágenes y rechaza peso/tipo inválido", () => {
  validateSaleReceiptUpload({ size: 1024, type: "application/pdf" });
  validateSaleReceiptUpload({ size: 1024, type: "image/jpeg" });

  assert.throws(() => validateSaleReceiptUpload({ size: 0, type: "application/pdf" }), /comprobante/);
  assert.throws(() => validateSaleReceiptUpload({ size: 6 * 1024 * 1024, type: "application/pdf" }), /5 MB/);
  assert.throws(() => validateSaleReceiptUpload({ size: 1024, type: "text/plain" }), /Formato no permitido/);
});

test("isManagedSaleReceiptPath solo reconoce uploads de ventas", () => {
  assert.equal(isManagedSaleReceiptPath(`${SALE_RECEIPT_UPLOAD_DIR}/abc.pdf`), true);
  assert.equal(isManagedSaleReceiptPath("/uploads/services/abc.webp"), false);
});
