import { promises as fs } from "node:fs";
import path from "node:path";

import {
  isAllowedPortfolioAspect,
  PORTFOLIO_IMAGE_MAX_BYTES,
  PORTFOLIO_IMAGE_MIME_TYPES,
} from "./constants";

export const PORTFOLIO_IMAGE_UPLOAD_DIR = "/uploads/portfolio";
export const PORTFOLIO_IMAGE_MEDIA_PREFIX = "/api/portfolio/media";

const ALLOWED_MIME_TYPES: Record<(typeof PORTFOLIO_IMAGE_MIME_TYPES)[number], "jpg" | "png" | "webp"> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function normalizePortfolioImagePath(image: string | null | undefined): string {
  return String(image ?? "").trim().split("?")[0];
}

export function getPortfolioMediaPath(projectId: string): string {
  return `${PORTFOLIO_IMAGE_MEDIA_PREFIX}/${projectId}`;
}

export function isManagedPortfolioImagePath(image: string | null | undefined): boolean {
  const normalized = normalizePortfolioImagePath(image);
  return (
    normalized.startsWith(`${PORTFOLIO_IMAGE_MEDIA_PREFIX}/`) ||
    normalized.startsWith(`${PORTFOLIO_IMAGE_UPLOAD_DIR}/`)
  );
}

export function withPortfolioImageCache(image: string, updatedAt: Date): string {
  if (!isManagedPortfolioImagePath(image)) {
    return image;
  }

  return `${normalizePortfolioImagePath(image)}?v=${updatedAt.getTime()}`;
}

export function getManagedPortfolioImageAbsolutePath(image: string): string {
  return path.join(process.cwd(), "public", normalizePortfolioImagePath(image).replace(/^\//, ""));
}

export function validatePortfolioImageUpload(file: Pick<File, "size" | "type">) {
  if (!file || file.size <= 0) {
    throw new Error("Debes seleccionar una imagen.");
  }

  if (file.size > PORTFOLIO_IMAGE_MAX_BYTES) {
    throw new Error("La imagen no puede superar 5 MB.");
  }

  if (!(file.type in ALLOWED_MIME_TYPES)) {
    throw new Error("Formato no permitido. Usa JPG, PNG o WEBP.");
  }
}

function assertMagicBytes(buffer: Buffer, mimeType: string) {
  if (mimeType === "image/jpeg" && !(buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)) {
    throw new Error("La imagen JPG no es válida.");
  }

  if (
    mimeType === "image/png" &&
    !(buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47)
  ) {
    throw new Error("La imagen PNG no es válida.");
  }

  if (mimeType === "image/webp") {
    const header = buffer.subarray(0, 12).toString("ascii");
    if (!header.startsWith("RIFF") || !header.includes("WEBP")) {
      throw new Error("La imagen WEBP no es válida.");
    }
  }
}

export function getImageDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length >= 24 && buffer[0] === 0x89 && buffer[1] === 0x50) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  if (buffer.length > 12 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;

    while (offset < buffer.length - 8) {
      if (buffer[offset] !== 0xff) break;

      const marker = buffer[offset + 1];
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        };
      }

      const size = buffer.readUInt16BE(offset + 2);
      offset += 2 + size;
    }
  }

  if (buffer.length >= 30 && buffer.subarray(0, 4).toString("ascii") === "RIFF") {
    const chunk = buffer.subarray(12, 16).toString("ascii");

    if (chunk === "VP8X") {
      const width = 1 + buffer[24] + (buffer[25] << 8) + (buffer[26] << 16);
      const height = 1 + buffer[27] + (buffer[28] << 8) + (buffer[29] << 16);
      return { width, height };
    }
  }

  return null;
}

export function assertPortfolioImageAspect(buffer: Buffer) {
  const dimensions = getImageDimensions(buffer);

  if (!dimensions) {
    throw new Error("No se pudieron leer las dimensiones de la imagen. Usa JPG, PNG o WEBP.");
  }

  if (!isAllowedPortfolioAspect(dimensions.width, dimensions.height)) {
    throw new Error("La imagen debe tener proporción 5:3 (ancho × alto).");
  }
}

export async function preparePortfolioImageUpload(file: File): Promise<{ mimeType: string; bytes: Buffer }> {
  validatePortfolioImageUpload(file);
  const buffer = Buffer.from(await file.arrayBuffer());
  assertMagicBytes(buffer, file.type);
  assertPortfolioImageAspect(buffer);

  return { mimeType: file.type, bytes: buffer };
}

export async function removeManagedPortfolioImageFile(image: string | null | undefined) {
  const normalized = normalizePortfolioImagePath(image);

  if (!normalized.startsWith(`${PORTFOLIO_IMAGE_UPLOAD_DIR}/`)) {
    return;
  }

  await fs.unlink(getManagedPortfolioImageAbsolutePath(normalized)).catch(() => undefined);
}
