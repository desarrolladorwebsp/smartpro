import test from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";

import { SALE_RECEIPT_UPLOAD_DIR, SALE_RECEIPT_MEDIA_DIR, getSaleReceiptMedia, isManagedSaleReceiptPath, removeSaleReceiptUpload, saveSaleReceiptUpload, validateSaleReceiptUpload, type SaleReceiptDatabase } from "./receipt";
import { saleReceiptResponse } from "./receipt-response";

test("validateSaleReceiptUpload acepta PDF e imágenes y rechaza peso/tipo inválido", () => {
  validateSaleReceiptUpload({ size: 1024, type: "application/pdf" });
  validateSaleReceiptUpload({ size: 1024, type: "image/jpeg" });

  assert.throws(() => validateSaleReceiptUpload({ size: 0, type: "application/pdf" }), /comprobante/);
  validateSaleReceiptUpload({ size: 4 * 1024 * 1024, type: "application/pdf" });
  assert.throws(() => validateSaleReceiptUpload({ size: 4 * 1024 * 1024 + 1, type: "application/pdf" }), /4 MB/);
  assert.throws(() => validateSaleReceiptUpload({ size: 1024, type: "text/plain" }), /Formato no permitido/);
});

test("isManagedSaleReceiptPath solo reconoce uploads de ventas", () => {
  assert.equal(isManagedSaleReceiptPath(`${SALE_RECEIPT_UPLOAD_DIR}/abc.pdf`), true);
  assert.equal(isManagedSaleReceiptPath("/uploads/services/abc.webp"), false);
  assert.equal(isManagedSaleReceiptPath("/uploads/sales/../../secret.pdf"), false);
  assert.equal(isManagedSaleReceiptPath(`${SALE_RECEIPT_MEDIA_DIR}/not-an-id`), false);
});

function receiptDatabase() {
  const rows = new Map<string, { fileName: string; mimeType: string; bytes: Buffer }>();
  const state = { creates: 0, failCreate: false, failInsert: false };
  const db = {
    async $executeRawUnsafe() {
      state.creates++;
      if (state.failCreate) throw new Error("storage unavailable");
      return 0;
    },
    async $executeRaw(strings: TemplateStringsArray, ...values: unknown[]) {
      const sql = strings.join("?");
      if (sql.includes("INSERT INTO SaleReceipt")) {
        if (state.failInsert) throw new Error("insert failed");
        const [id, fileName, mimeType, bytes] = values as [string, string, string, Buffer];
        rows.set(id, { fileName, mimeType, bytes: Buffer.from(bytes) });
      } else if (sql.includes("DELETE FROM SaleReceipt")) {
        rows.delete(String(values[0]));
      } else throw new Error("Unexpected SQL");
      return 1;
    },
    async $queryRaw(_strings: TemplateStringsArray, id: string) {
      const row = rows.get(id);
      return row ? [row] : [];
    },
  } as unknown as SaleReceiptDatabase;
  return { db, rows, state };
}

const pdfFile = () => new File(["%PDF-1.7\ncomprobante"], "comprobante.pdf", { type: "application/pdf" });
const idFromPath = (receiptPath: string) => receiptPath.split("/").at(-1)!;

test("guarda y recupera comprobantes sin escribir en el filesystem de Vercel", async (t) => {
  t.mock.method(fs, "mkdir", async () => { throw new Error("EROFS /var/task"); });
  t.mock.method(fs, "writeFile", async () => { throw new Error("EROFS /var/task"); });
  const { db, state } = receiptDatabase();
  const first = await saveSaleReceiptUpload(pdfFile(), db);
  const second = await saveSaleReceiptUpload(pdfFile(), db);
  assert.notEqual(first.path, second.path, "un comprobante nuevo no sobrescribe el anterior");
  assert.ok(isManagedSaleReceiptPath(first.path));
  const loaded = await getSaleReceiptMedia(idFromPath(first.path), db);
  assert.equal(loaded?.bytes.toString(), "%PDF-1.7\ncomprobante");
  assert.equal(loaded?.mimeType, "application/pdf");
  assert.equal(loaded?.fileName, "comprobante.pdf");
  assert.equal(state.creates, 1);
  await removeSaleReceiptUpload(first.path, db);
  assert.equal(await getSaleReceiptMedia(idFromPath(first.path), db), null);
  assert.ok(await getSaleReceiptMedia(idFromPath(second.path), db));
});

test("valida la firma real de PDF, JPG, PNG y WEBP antes de guardarlos", async () => {
  const { db, rows } = receiptDatabase();
  const fixtures = [
    ["image/jpeg", [0xff, 0xd8, 0xff, 0xe0]],
    ["image/png", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
    ["image/webp", [...Buffer.from("RIFF0000WEBP")]],
  ] as const;
  for (const [type, bytes] of fixtures) {
    await saveSaleReceiptUpload(new File([new Uint8Array(bytes)], "foto", { type }), db);
  }
  for (const type of ["application/pdf", "image/jpeg", "image/png", "image/webp"]) {
    await assert.rejects(saveSaleReceiptUpload(new File(["archivo falso"], "fake", { type }), db), /no es válid/);
  }
  assert.equal(rows.size, 3);
});

test("un fallo de almacenamiento se informa y permite reintentar", async () => {
  const { db, rows, state } = receiptDatabase();
  state.failCreate = true;
  await assert.rejects(saveSaleReceiptUpload(pdfFile(), db), /storage unavailable/);
  state.failCreate = false;
  state.failInsert = true;
  await assert.rejects(saveSaleReceiptUpload(pdfFile(), db), /insert failed/);
  assert.equal(rows.size, 0);
  state.failInsert = false;
  assert.ok(await saveSaleReceiptUpload(pdfFile(), db));
});

test("no consulta ni elimina otros archivos o identificadores inválidos", async () => {
  const { db, state } = receiptDatabase();
  assert.equal(await getSaleReceiptMedia("../../secret", db), null);
  await removeSaleReceiptUpload("/uploads/services/imagen.png", db);
  await removeSaleReceiptUpload("/api/sales/receipts/../../secret", db);
  assert.equal(state.creates, 0);
});

test("el comprobante requiere sesión y no se consulta antes de autenticar", async () => {
  let reads = 0;
  const response = await saleReceiptResponse(Promise.resolve({ id: "id" }), {
    requireSession: async () => { throw new Error("no session"); },
    loadReceipt: async () => { reads++; return null; },
  });
  assert.equal(response.status, 401);
  assert.equal(reads, 0);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
});

test("la descarga autenticada devuelve el archivo exacto y evita caché pública", async () => {
  const { db } = receiptDatabase();
  const saved = await saveSaleReceiptUpload(pdfFile(), db);
  const response = await saleReceiptResponse(Promise.resolve({ id: idFromPath(saved.path) }), {
    requireSession: async () => ({}), loadReceipt: (id) => getSaleReceiptMedia(id, db),
  });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "%PDF-1.7\ncomprobante");
  assert.equal(response.headers.get("content-type"), "application/pdf");
  assert.equal(response.headers.get("content-disposition"), 'inline; filename="comprobante.pdf"');
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  const missing = await saleReceiptResponse(Promise.resolve({ id: "missing" }), {
    requireSession: async () => ({}), loadReceipt: async () => null,
  });
  assert.equal(missing.status, 404);
});
