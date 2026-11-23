import { NextResponse } from "next/server";
import { getCurrentAdminSession } from "@/lib/auth";
import { updateClientCrmStage } from "@/lib/clients/repository";
import { isClientCrmStage } from "@/lib/clients/types";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Inicia sesión para mover clientes." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const stage: unknown = body?.crmStage;
  if (!isClientCrmStage(stage)) {
    return NextResponse.json({ error: "La etapa del CRM no es válida." }, { status: 400 });
  }

  try {
    const { id } = await params;
    if (!(await updateClientCrmStage(id, stage, session.email))) {
      return NextResponse.json({ error: "El cliente no existe." }, { status: 404 });
    }
    return NextResponse.json({ crmStage: stage });
  } catch (error) {
    console.error("[smartpro:clients:crm-stage]", error);
    return NextResponse.json({ error: "No se pudo guardar la etapa." }, { status: 500 });
  }
}
