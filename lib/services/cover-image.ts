export const SERVICE_COVER_UPLOAD_DIR = "/uploads/services";
export const SERVICE_COVER_MEDIA_PREFIX = "/api/services/media";
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES: Record<string, "jpg" | "png" | "webp"> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function normalizeCoverPath(coverImage: string | null | undefined): string {
  return String(coverImage ?? "").trim().split("?")[0];
}

export function getServiceCoverMediaPath(serviceId: string): string {
  return `${SERVICE_COVER_MEDIA_PREFIX}/${serviceId}`;
}

export function isManagedServiceCoverPath(coverImage: string | null | undefined): boolean {
  const normalized = normalizeCoverPath(coverImage);
  return (
    normalized.startsWith(`${SERVICE_COVER_MEDIA_PREFIX}/`) ||
    normalized.startsWith(`${SERVICE_COVER_UPLOAD_DIR}/`)
  );
}

export function withServiceCoverCache(coverImage: string, updatedAt: Date): string {
  if (!isManagedServiceCoverPath(coverImage)) {
    return coverImage;
  }

  return `${normalizeCoverPath(coverImage)}?v=${updatedAt.getTime()}`;
}

export function validateServiceCoverUpload(file: Pick<File, "size" | "type">) {
  if (!file || file.size <= 0) {
    throw new Error("Debes seleccionar una imagen.");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("La imagen no puede superar 5 MB.");
  }

  if (!ALLOWED_MIME_TYPES[file.type]) {
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

export async function prepareServiceCoverUpload(file: File): Promise<{ mimeType: string; bytes: Buffer }> {
  validateServiceCoverUpload(file);
  const buffer = Buffer.from(await file.arrayBuffer());
  assertMagicBytes(buffer, file.type);
  return { mimeType: file.type, bytes: buffer };
}
