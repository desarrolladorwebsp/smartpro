import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { updateServiceSubcategoryStatus } from "@/lib/services/repository";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { status?: "ACTIVE" | "INACTIVE" };

    if (!body.status) {
      return NextResponse.json({ error: "Falta el estado de la subcategoría." }, { status: 400 });
    }

    const subcategory = await updateServiceSubcategoryStatus(id, body.status);
    return NextResponse.json({ subcategory }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar la subcategoría.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
