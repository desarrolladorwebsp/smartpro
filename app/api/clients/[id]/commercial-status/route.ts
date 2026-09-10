import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { parseClientCommercialStatus, updateClientCommercialStatus } from "@/lib/clients/repository";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { commercialStatus?: unknown };
    const commercialStatus = parseClientCommercialStatus(body.commercialStatus);
    const client = await updateClientCommercialStatus(id, commercialStatus);
    return NextResponse.json({ client }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar el estado comercial.";
    const status = message === "El cliente no existe." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
