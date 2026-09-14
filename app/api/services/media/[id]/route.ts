import { NextResponse } from "next/server";

import { getServiceCoverMedia } from "@/lib/services/repository";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const media = await getServiceCoverMedia(id);

    if (!media) {
      return NextResponse.json({ error: "Imagen no encontrada." }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(media.bytes), {
      status: 200,
      headers: {
        "Content-Type": media.mimeType,
        "Cache-Control": "public, max-age=3600, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[smartpro:services:cover-media]", error);
    return NextResponse.json({ error: "No se pudo cargar la imagen." }, { status: 500 });
  }
}
