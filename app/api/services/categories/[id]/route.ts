import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { deleteServiceCategory } from "@/lib/services/repository";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    await deleteServiceCategory(id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo eliminar el servicio.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
