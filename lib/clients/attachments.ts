export const CLIENT_ATTACHMENT_MAX_BYTES = 4 * 1024 * 1024;
export const CLIENT_ATTACHMENT_FORMATS = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type ClientAttachmentMimeType = keyof typeof CLIENT_ATTACHMENT_FORMATS;

export type ClientAttachmentItem = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
};

export function isClientAttachmentMimeType(value: string): value is ClientAttachmentMimeType {
  return Object.hasOwn(CLIENT_ATTACHMENT_FORMATS, value);
}
