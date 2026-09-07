import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { updateClientStatus } from "@/lib/clients/repository";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { status?: "ACTIVO" | "POTENCIAL" | "INACTIVO" };

    if (!body.status) {
      return NextResponse.json({ error: "Falta el estado del cliente." }, { status: 400 });
    }

    const client = await updateClientStatus(id, body.status);
    return NextResponse.json({ client }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar el estado del cliente.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
