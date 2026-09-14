import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { clearServiceCategoryCoverImage, persistServiceCategoryCover } from "@/lib/services/repository";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("cover");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Debes enviar una imagen." }, { status: 400 });
    }

    const category = await persistServiceCategoryCover(id, file);
    return NextResponse.json({ category }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar la imagen del servicio.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const category = await clearServiceCategoryCoverImage(id);
    return NextResponse.json({ category }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo quitar la imagen del servicio.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
