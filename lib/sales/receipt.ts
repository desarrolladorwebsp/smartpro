import { promises as fs } from "node:fs";
import path from "node:path";

import { getSaleReceiptValidationError, SALE_RECEIPT_MIME_TYPES } from "./types";

export const SALE_RECEIPT_UPLOAD_DIR = "/uploads/sales";

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
  return normalized.startsWith(`${SALE_RECEIPT_UPLOAD_DIR}/`);
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
    if (buffer.subarray(0, 4).toString("ascii") !== "%PDF") {
      throw new Error("El PDF del comprobante no es válido.");
    }
    return;
  }

  if (mimeType === "image/jpeg" && !(buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)) {
    throw new Error("La imagen JPG del comprobante no es válida.");
  }

  if (
    mimeType === "image/png" &&
    !(buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47)
  ) {
    throw new Error("La imagen PNG del comprobante no es válida.");
  }

  if (mimeType === "image/webp") {
    const header = buffer.subarray(0, 12).toString("ascii");
    if (!header.startsWith("RIFF") || !header.includes("WEBP")) {
      throw new Error("La imagen WEBP del comprobante no es válida.");
    }
  }
}

export async function saveSaleReceiptUpload(saleId: string, file: File): Promise<{ path: string; fileName: string }> {
  validateSaleReceiptUpload(file);
  const buffer = Buffer.from(await file.arrayBuffer());
  assertMagicBytes(buffer, file.type);

  await fs.mkdir(getUploadAbsoluteDir(), { recursive: true });

  const extension = ALLOWED_MIME_TYPES[file.type as (typeof SALE_RECEIPT_MIME_TYPES)[number]];
  if (!extension) {
    throw new Error("Formato no permitido. Usa PDF, JPG, PNG o WEBP.");
  }
  const originalName = String(file.name ?? `comprobante.${extension}`).replace(/[^\w.\-() ]+/g, "_").slice(0, 120);
  const fileName = `${saleId}.${extension}`;
  await fs.writeFile(path.join(getUploadAbsoluteDir(), fileName), buffer);

  return {
    path: `${SALE_RECEIPT_UPLOAD_DIR}/${fileName}`,
    fileName: originalName || fileName,
  };
}
