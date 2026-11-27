import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";

import type { getCurrentAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CLIENT_ATTACHMENT_FORMATS, CLIENT_ATTACHMENT_MAX_BYTES, isClientAttachmentMimeType } from "./attachments";
import { parseCommercialClientId } from "./commercial-clients";

export const clientAttachmentColumns = {
  id: true, fileName: true, mimeType: true, size: true, uploadedBy: true, createdAt: true,
} satisfies Prisma.ClientAttachmentSelect;

export async function getClientAttachmentAccess(clientKey: string, session: NonNullable<Awaited<ReturnType<typeof getCurrentAdminSession>>>) {
  const client = parseCommercialClientId(clientKey);
  if (!client || client.id.length > 191) return null;
  if (!prisma) throw new Error("Base de datos no disponible.");

  const active = { id: client.id, deletedAt: null };
  const administrator = session.role === "ADMIN";
  if (client.kind === "business") {
    const business = await prisma.business.findFirst({
      where: {
        ...active,
        ...(administrator ? {} : {
          OR: [
            { responsibleId: session.id },
            { clients: { some: { deletedAt: null, assignedExecutiveId: session.id } } },
          ],
        }),
      },
      select: { id: true },
    });
    return business ? { db: prisma, owner: { businessId: business.id, clientId: null } } : null;
  }

  const person = await prisma.client.findFirst({
    where: { ...active, businessId: null, ...(administrator ? {} : { assignedExecutiveId: session.id }) },
    select: { id: true },
  });
  return person ? { db: prisma, owner: { businessId: null, clientId: person.id } } : null;
}

export async function prepareClientAttachment(file: File) {
  if (!file.size || file.size > CLIENT_ATTACHMENT_MAX_BYTES) return { error: "El archivo debe pesar entre 1 byte y 4 MB." };

  const { type: mimeType } = file;
  if (!isClientAttachmentMimeType(mimeType)) return { error: "Usa un archivo PDF, JPG, PNG o WebP." };

  const bytes = Buffer.from(await file.arrayBuffer());
  const matchesFormat = {
    "application/pdf": bytes.subarray(0, 5).toString("ascii") === "%PDF-",
    "image/jpeg": bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])),
    "image/png": bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    "image/webp": bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP",
  }[mimeType];
  if (!matchesFormat) return { error: "El contenido del archivo no coincide con su formato." };

  const originalName = file.name.normalize("NFC").replace(/[\p{Cc}\p{Cf}/\\]/gu, "_").trim();
  const extension = CLIENT_ATTACHMENT_FORMATS[mimeType];
  const originalExtension = originalName.split(".").pop()?.toLowerCase();
  const suffix = originalExtension === "jpeg" && extension === "jpg" ? "jpeg" : extension;
  const stem = originalName.replace(/\.[^.]+$/, "").trim() || "archivo";
  const fileName = `${Array.from(stem).slice(0, 150).join("")}.${suffix}`;
  const fingerprint = createHash("sha256").update(fileName).update("\0").update(bytes).digest("hex");
  return { data: { fileName, mimeType, size: bytes.length, fingerprint, bytes } };
}

export async function saveClientAttachment(
  access: NonNullable<Awaited<ReturnType<typeof getClientAttachmentAccess>>>,
  data: NonNullable<Awaited<ReturnType<typeof prepareClientAttachment>>["data"]>,
  uploadedBy: string,
) {
  const { db, owner } = access;
  try {
    return await db.clientAttachment.create({ data: { ...owner, ...data, uploadedBy }, select: clientAttachmentColumns });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    const existing = await db.clientAttachment.findFirst({ where: { ...owner, fingerprint: data.fingerprint }, select: clientAttachmentColumns });
    if (!existing) throw error;
    return existing;
  }
}
