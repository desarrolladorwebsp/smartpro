import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { getQuoteById, updateQuoteStatus } from "@/lib/quotes/repository";
import { isQuoteStatus } from "@/lib/quotes/types";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No se pudo cargar la cotización." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const quote = await getQuoteById(id);

    if (!quote) {
      return NextResponse.json({ error: "La cotización no existe." }, { status: 404 });
    }

    return NextResponse.json({ quote }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[smartpro:quotes:detail]", error);
    return NextResponse.json({ error: "No se pudo cargar la cotización." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { status?: unknown };

    if (!isQuoteStatus(body.status)) {
      return NextResponse.json({ error: "Estado de cotización inválido." }, { status: 400 });
    }

    const quote = await updateQuoteStatus(id, body.status);
    return NextResponse.json({ quote }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar la cotización.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
