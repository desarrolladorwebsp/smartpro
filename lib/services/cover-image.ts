import { promises as fs } from "node:fs";
import path from "node:path";

export const SERVICE_COVER_UPLOAD_DIR = "/uploads/services";
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES: Record<string, "jpg" | "png" | "webp"> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function getUploadAbsoluteDir() {
  return path.join(process.cwd(), "public", "uploads", "services");
}

export function isManagedServiceCoverPath(coverImage: string | null | undefined): boolean {
  const normalized = String(coverImage ?? "").trim();
  return normalized.startsWith(`${SERVICE_COVER_UPLOAD_DIR}/`);
}

export function getManagedServiceCoverAbsolutePath(coverImage: string): string {
  return path.join(process.cwd(), "public", coverImage.replace(/^\//, ""));
}

export async function ensureServiceCoverUploadDir() {
  await fs.mkdir(getUploadAbsoluteDir(), { recursive: true });
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

export async function saveServiceCoverUpload(serviceId: string, file: File): Promise<string> {
  validateServiceCoverUpload(file);
  await ensureServiceCoverUploadDir();

  const extension = ALLOWED_MIME_TYPES[file.type];
  const fileName = `${serviceId}.${extension}`;
  const absolutePath = path.join(getUploadAbsoluteDir(), fileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await fs.writeFile(absolutePath, buffer);

  return `${SERVICE_COVER_UPLOAD_DIR}/${fileName}`;
}

export async function removeManagedServiceCoverFile(coverImage: string | null | undefined) {
  if (!isManagedServiceCoverPath(coverImage)) {
    return;
  }

  await fs.unlink(getManagedServiceCoverAbsolutePath(String(coverImage))).catch(() => undefined);
}
