import { getCurrentAdminSession } from "@/lib/auth";
import { getClientAttachmentAccess } from "@/lib/clients/attachment-repository";
import { isClientAttachmentMimeType } from "@/lib/clients/attachments";

export const runtime = "nodejs";

const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: Request, { params }: { params: Promise<{ id: string; attachmentId: string }> }) {
  const session = await getCurrentAdminSession();
  if (!session) return Response.json({ error: "Inicia sesión para consultar archivos." }, { status: 401, headers });

  const { id, attachmentId } = await params;
  try {
    const access = attachmentId.length <= 191 ? await getClientAttachmentAccess(id, session) : null;
    const file = await access?.db.clientAttachment.findFirst({
      where: { ...access.owner, id: attachmentId },
      select: { bytes: true, fileName: true, mimeType: true },
    });
    if (!file || !isClientAttachmentMimeType(file.mimeType)) {
      return Response.json({ error: "Archivo no disponible." }, { status: 404, headers });
    }

    const disposition = new URL(request.url).searchParams.has("download") ? "attachment" : "inline";
    const fallbackName = file.fileName.replace(/[^a-zA-Z0-9._ -]/g, "_");
    const encodedName = encodeURIComponent(file.fileName).replace(/['()*]/g, (char) => `%${char.charCodeAt(0).toString(16)}`);
    return new Response(new Uint8Array(file.bytes), {
      headers: {
        ...headers,
        "Content-Type": file.mimeType,
        "Content-Length": String(file.bytes.byteLength),
        "Content-Disposition": `${disposition}; filename="${fallbackName}"; filename*=UTF-8''${encodedName}`,
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Resource-Policy": "same-origin",
      },
    });
  } catch (error) {
    console.error("[smartpro:clientes:adjuntos] Error al recuperar archivo", error);
    return Response.json({ error: "No se pudo abrir el archivo." }, { status: 500, headers });
  }
}
