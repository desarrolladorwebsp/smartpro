import { NextResponse } from "next/server";
import { getCurrentAdminSession } from "@/lib/auth";
import { assignBusinessResponsible, moveBusinessCard, updateBusinessCrm } from "@/lib/clients/business-repository";
import { isClientCrmStage, isClientStatus } from "@/lib/clients/types";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentAdminSession();
  if (!session) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const data = isClientCrmStage(body?.crmStage) ? { crmStage: body.crmStage }
    : isClientStatus(body?.status) ? { status: body.status } : null;
  const assigning = body?.responsibleId === null || typeof body?.responsibleId === "string";
  const from: unknown = body?.reactivateFrom ?? null;
  if (from !== null && from !== "ARCHIVED") return NextResponse.json({ error: "El estado de origen no es válido." }, { status: 400 });
  const anchor = typeof body?.anchor?.id === "string" && typeof body.anchor.after === "boolean" ? body.anchor : undefined;
  if (body?.anchor && !anchor) return NextResponse.json({ error: "Posición inválida." }, { status: 400 });
  if (from && !isClientCrmStage(body?.crmStage)) return NextResponse.json({ error: "Selecciona la etapa del cliente." }, { status: 400 });
  if (!data && !assigning) return NextResponse.json({ error: "El cambio no es válido." }, { status: 400 });

  try {
    const { id } = await params;
    const changed = isClientCrmStage(body?.crmStage) ? await moveBusinessCard(id, body.crmStage, session.email, anchor, from)
      : assigning ? await assignBusinessResponsible(id, body.responsibleId) : await updateBusinessCrm(id, data!.status!, session.email);
    if (!changed) {
      if (from) return NextResponse.json({ error: "El estado del cliente cambió. Actualiza el tablero." }, { status: 409 });
      return NextResponse.json({ error: "El cliente no existe." }, { status: 404 });
    }
    return NextResponse.json(data ?? { responsibleId: body.responsibleId });
  } catch (error) {
    if (error instanceof Error && ["Selecciona un responsable activo.", "La tarjeta de referencia cambió de columna."].includes(error.message)) return NextResponse.json({ error: error.message }, { status: 409 });
    console.error("[smartpro:businesses:crm]", error);
    return NextResponse.json({ error: "No se pudo guardar el cambio." }, { status: 500 });
  }
}
