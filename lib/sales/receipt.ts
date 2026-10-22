import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

import { getPrismaClient } from "../db";
import { getSaleReceiptValidationError, SALE_RECEIPT_MIME_TYPES } from "./types";

export const SALE_RECEIPT_UPLOAD_DIR = "/uploads/sales";
export const SALE_RECEIPT_MEDIA_DIR = "/api/sales/receipts";

export type SaleReceiptDatabase = Pick<PrismaClient, "$executeRawUnsafe" | "$executeRaw" | "$queryRaw">;
const ensurePromises = new WeakMap<object, Promise<void>>();

export async function ensureSaleReceiptStorage(db: SaleReceiptDatabase): Promise<void> {
  let pending = ensurePromises.get(db);
  if (!pending) {
    pending = db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS \`SaleReceipt\` (
      \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
      \`fileName\` VARCHAR(191) NOT NULL,
      \`mimeType\` VARCHAR(64) NOT NULL,
      \`bytes\` MEDIUMBLOB NOT NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`).then(() => undefined);
    ensurePromises.set(db, pending);
  }
  try {
    await pending;
  } catch (error) {
    ensurePromises.delete(db);
    throw error;
  }
}

function database(client?: SaleReceiptDatabase): SaleReceiptDatabase {
  const db = client ?? getPrismaClient();
  if (!db) throw new Error("No hay conexión a la base de datos para guardar el comprobante.");
  return db;
}

function receiptId(receiptPath: string): string | null {
  const id = receiptPath.startsWith(`${SALE_RECEIPT_MEDIA_DIR}/`)
    ? receiptPath.slice(SALE_RECEIPT_MEDIA_DIR.length + 1)
    : "";
  return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id) ? id : null;
}

const ALLOWED_MIME_TYPES: Record<(typeof SALE_RECEIPT_MIME_TYPES)[number], "pdf" | "jpg" | "png" | "webp"> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function getUploadAbsoluteDir() {
  return path.join(process.cwd(), "public", "uploads", "sales");
}

export function isManagedSaleReceiptPath(receiptPath: string | null | undefined): boolean {
  const normalized = String(receiptPath ?? "").trim();
  return Boolean(receiptId(normalized)) || /^\/uploads\/sales\/[\w.\-]+\.(pdf|jpg|png|webp)$/.test(normalized);
}

export function validateSaleReceiptUpload(file: Pick<File, "size" | "type">) {
  if (!file || file.size <= 0) {
    throw new Error("Debes seleccionar un comprobante.");
  }

  const error = getSaleReceiptValidationError(file);
  if (error) {
    throw new Error(error);
  }
}

function assertMagicBytes(buffer: Buffer, mimeType: string) {
  if (mimeType === "application/pdf") {
    if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
      throw new Error("El PDF del comprobante no es válido.");
    }
    return;
  }

  if (mimeType === "image/jpeg" && !(buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)) {
    throw new Error("La imagen JPG del comprobante no es válida.");
  }

  if (
    mimeType === "image/png" &&
    !buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    throw new Error("La imagen PNG del comprobante no es válida.");
  }

  if (mimeType === "image/webp") {
    const header = buffer.subarray(0, 12).toString("ascii");
    if (!header.startsWith("RIFF") || header.slice(8, 12) !== "WEBP") {
      throw new Error("La imagen WEBP del comprobante no es válida.");
    }
  }
}

export async function saveSaleReceiptUpload(file: File, client?: SaleReceiptDatabase): Promise<{ path: string; fileName: string }> {
  validateSaleReceiptUpload(file);
  const buffer = Buffer.from(await file.arrayBuffer());
  validateSaleReceiptUpload({ size: buffer.length, type: file.type });
  assertMagicBytes(buffer, file.type);

  const extension = ALLOWED_MIME_TYPES[file.type as (typeof SALE_RECEIPT_MIME_TYPES)[number]];
  if (!extension) {
    throw new Error("Formato no permitido. Usa PDF, JPG, PNG o WEBP.");
  }
  const originalName = String(file.name ?? `comprobante.${extension}`).replace(/[^\w.\-() ]+/g, "_").slice(0, 120);
  const id = randomUUID();
  const fileName = originalName || `comprobante.${extension}`;
  const db = database(client);
  await ensureSaleReceiptStorage(db);
  await db.$executeRaw`INSERT INTO SaleReceipt (id, fileName, mimeType, bytes)
    VALUES (${id}, ${fileName}, ${file.type}, ${buffer})`;

  return {
    path: `${SALE_RECEIPT_MEDIA_DIR}/${id}`,
    fileName,
  };
}

export async function getSaleReceiptMedia(id: string, client?: SaleReceiptDatabase) {
  if (!receiptId(`${SALE_RECEIPT_MEDIA_DIR}/${id}`)) return null;
  const db = database(client);
  await ensureSaleReceiptStorage(db);
  const rows = await db.$queryRaw<Array<{ fileName: string; mimeType: string; bytes: Uint8Array }>>`
    SELECT fileName, mimeType, bytes FROM SaleReceipt WHERE id = ${id} LIMIT 1`;
  const row = rows[0];
  return row ? { fileName: row.fileName, mimeType: row.mimeType, bytes: Buffer.from(row.bytes) } : null;
}

/** Removes only SmartPro receipts; retains compatibility with historical disk files. */
export async function removeSaleReceiptUpload(receiptPath: string | null | undefined, client?: SaleReceiptDatabase): Promise<void> {
  const normalized = String(receiptPath ?? "").trim();
  if (!isManagedSaleReceiptPath(normalized)) return;

  const id = receiptId(normalized);
  if (id) {
    const db = database(client);
    await ensureSaleReceiptStorage(db);
    await db.$executeRaw`DELETE FROM SaleReceipt WHERE id = ${id}`;
    return;
  }

  const fileName = normalized.slice(`${SALE_RECEIPT_UPLOAD_DIR}/`.length);
  if (!fileName || path.basename(fileName) !== fileName) return;

  await fs.unlink(path.join(getUploadAbsoluteDir(), fileName)).catch(() => undefined);
}
