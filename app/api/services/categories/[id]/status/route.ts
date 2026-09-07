import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { updateServiceCategoryStatus } from "@/lib/services/repository";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { status?: "ACTIVE" | "INACTIVE" };

    if (!body.status) {
      return NextResponse.json({ error: "Falta el estado de la categoría." }, { status: 400 });
    }

    const category = await updateServiceCategoryStatus(id, body.status);
    return NextResponse.json({ category }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar la categoría.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
