import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { saveServiceCoverUpload } from "@/lib/services/cover-image";
import { clearServiceCategoryCoverImage, setServiceCategoryCoverImage } from "@/lib/services/repository";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("cover");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Debes enviar una imagen." }, { status: 400 });
    }

    const coverImage = await saveServiceCoverUpload(id, file);
    const category = await setServiceCategoryCoverImage(id, coverImage);

    return NextResponse.json({ category }, { status: 200 });
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
    return NextResponse.json({ category }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo quitar la imagen del servicio.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
