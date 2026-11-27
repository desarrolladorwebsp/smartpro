import { getCurrentAdminSession } from "@/lib/auth";
import { clientAttachmentColumns, getClientAttachmentAccess, prepareClientAttachment, saveClientAttachment } from "@/lib/clients/attachment-repository";
import { CLIENT_ATTACHMENT_MAX_BYTES } from "@/lib/clients/attachments";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

const headers = { "Cache-Control": "private, no-store" };
const failure = (error: string, status: number) => Response.json({ error }, { status, headers });

export async function GET(_request: Request, { params }: Context) {
  const session = await getCurrentAdminSession();
  if (!session) return failure("Inicia sesión para consultar archivos.", 401);

  try {
    const access = await getClientAttachmentAccess((await params).id, session);
    if (!access) return failure("Los archivos de este cliente requieren acceso a su cuenta.", 404);
    const files = await access.db.clientAttachment.findMany({
      where: access.owner,
      select: clientAttachmentColumns,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    return Response.json({ files }, { headers });
  } catch (error) {
    console.error("[smartpro:clientes:adjuntos] Error al listar archivos", error);
    return failure("No se pudieron cargar los archivos.", 500);
  }
}

export async function POST(request: Request, { params }: Context) {
  const session = await getCurrentAdminSession();
  if (!session) return failure("Inicia sesión para adjuntar archivos.", 401);

  try {
    const access = await getClientAttachmentAccess((await params).id, session);
    if (!access) return failure("Los archivos de este cliente requieren acceso a su cuenta.", 404);
    if (Number(request.headers.get("content-length")) > CLIENT_ATTACHMENT_MAX_BYTES + 64 * 1024) {
      return failure("El archivo no puede superar 4 MB.", 413);
    }
    const form = await request.formData().catch(() => null);
    const [file, ...rest] = form?.getAll("file") ?? [];
    if (!(file instanceof File) || rest.length) return failure("Selecciona un archivo para adjuntar.", 400);

    const prepared = await prepareClientAttachment(file);
    if (!prepared.data) return failure(prepared.error, 400);
    const saved = await saveClientAttachment(access, prepared.data, session.email);
    return Response.json({ file: saved }, { headers });
  } catch (error) {
    console.error("[smartpro:clientes:adjuntos] Error al adjuntar archivo", error);
    return failure("No se pudo adjuntar el archivo.", 500);
  }
}
