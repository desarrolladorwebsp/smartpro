import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { assignClientExecutive, parseAssignedExecutiveId } from "@/lib/clients/repository";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { executiveId?: unknown };
    const executiveId = parseAssignedExecutiveId(body.executiveId);
    const client = await assignClientExecutive(id, executiveId);
    return NextResponse.json({ client }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo asignar el ejecutivo.";
    const status = message === "El cliente no existe." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
