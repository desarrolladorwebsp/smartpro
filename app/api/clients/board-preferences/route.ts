import { getCurrentAdminSession } from "@/lib/auth";
import { parseClientBoardPreferencePatch } from "@/lib/clients/board-preferences";
import { saveClientBoardPreferences } from "@/lib/clients/board-preferences-repository";

export async function PATCH(request: Request) {
  const session = await getCurrentAdminSession();
  if (!session) return Response.json({ error: "Inicia sesión." }, { status: 401 });

  const content = await request.text();
  if (new TextEncoder().encode(content).length > 60_000) {
    return Response.json({ error: "La configuración supera el tamaño permitido." }, { status: 413 });
  }

  let patch;
  try {
    const body = JSON.parse(content);
    if (body?.userId !== session.id) {
      return Response.json({ error: "La sesión cambió. Vuelve a abrir Clientes." }, { status: 409 });
    }
    patch = parseClientBoardPreferencePatch(body.patch);
  } catch {
    return Response.json({ error: "La configuración no es válida." }, { status: 400 });
  }
  if (Object.keys(patch).length === 0) {
    return Response.json({ error: "No hay preferencias para guardar." }, { status: 400 });
  }

  try {
    await saveClientBoardPreferences(session.id, patch);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[smartpro:clients:board-preferences]", error);
    return Response.json({ error: "No se pudo guardar la configuración." }, { status: 500 });
  }
}
