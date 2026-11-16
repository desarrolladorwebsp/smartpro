import { getCurrentAdminSession } from "@/lib/auth";
import { isCrmArchiveState, parseReactivationDate } from "@/lib/clients/crm-archive";
import { archiveCrmClient } from "@/lib/clients/crm-archive-repository";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentAdminSession())) return Response.json({ error: "Inicia sesión." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (body?.confirmed !== true || !isCrmArchiveState(body.state) || (body.kind !== "business" && body.kind !== "person")) {
    return Response.json({ error: "Confirma el cambio de estado." }, { status: 400 });
  }

  const date = body.state === "PAUSED" ? parseReactivationDate(body.reactivateOn) : null;
  if (body.state === "PAUSED" && !date) {
    return Response.json({ error: "Elige una fecha de reactivación posterior a hoy." }, { status: 400 });
  }

  try {
    const { id } = await params;
    if (!(await archiveCrmClient(body.kind, id, body.state, date))) {
      return Response.json({ error: "El cliente ya no está activo en el tablero. Actualiza la página." }, { status: 409 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[smartpro:crm:archivo]", error);
    return Response.json({ error: "No se pudo guardar el cambio." }, { status: 500 });
  }
}
