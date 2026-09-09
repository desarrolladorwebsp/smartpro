import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { getServicePlanById, updateServicePlan } from "@/lib/services/repository";
import { parseServicePlanPayload } from "@/lib/services/types";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const plan = await getServicePlanById(id);

    if (!plan) {
      return NextResponse.json({ error: "Servicio no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ plan }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "No se pudo cargar el servicio." }, { status: 401 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const plan = await updateServicePlan(id, parseServicePlanPayload(body));

    return NextResponse.json({ plan }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar el servicio.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
