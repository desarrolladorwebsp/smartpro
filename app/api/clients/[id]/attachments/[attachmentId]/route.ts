import { getCurrentAdminSession } from "@/lib/auth";
import { getClientAttachmentAccess } from "@/lib/clients/attachment-repository";
import { isClientAttachmentMimeType } from "@/lib/clients/attachments";

export const runtime = "nodejs";

const headers = { "Cache-Control": "private, no-store" };
type Context = { params: Promise<{ id: string; attachmentId: string }> };

export async function GET(request: Request, { params }: Context) {
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

export async function DELETE(request: Request, { params }: Context) {
  const session = await getCurrentAdminSession();
  if (!session) return Response.json({ error: "Inicia sesión para eliminar archivos." }, { status: 401, headers });

  const confirmation = await request.json().catch(() => null);
  if (confirmation?.confirmed !== true) {
    return Response.json({ error: "Confirma la eliminación del archivo." }, { status: 400, headers });
  }

  const { id, attachmentId } = await params;
  try {
    const access = attachmentId.length <= 191 ? await getClientAttachmentAccess(id, session) : null;
    if (!access) return Response.json({ error: "Archivo no disponible." }, { status: 404, headers });

    const { count } = await access.db.clientAttachment.deleteMany({ where: { ...access.owner, id: attachmentId } });
    if (!count) return Response.json({ error: "El archivo ya no está disponible.", missing: true }, { status: 404, headers });
    return new Response(null, { status: 204, headers });
  } catch (error) {
    console.error("[smartpro:clientes:adjuntos] Error al eliminar archivo", error);
    return Response.json({ error: "No se pudo eliminar el archivo. Vuelve a intentarlo." }, { status: 500, headers });
  }
}
