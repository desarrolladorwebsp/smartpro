import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { savePortfolioImageUpload } from "@/lib/portfolio/image";
import { clearPortfolioProjectImage, setPortfolioProjectImage } from "@/lib/portfolio/repository";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No se pudo subir la imagen." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Debes enviar una imagen." }, { status: 400 });
    }

    const image = await savePortfolioImageUpload(id, file);
    const project = await setPortfolioProjectImage(id, image);
    return NextResponse.json({ project }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo subir la imagen.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No se pudo quitar la imagen." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const project = await clearPortfolioProjectImage(id);
    return NextResponse.json({ project }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo quitar la imagen.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
