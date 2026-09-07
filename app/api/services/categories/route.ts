import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { listServiceCategories, updateServiceCategory, upsertServiceCategory } from "@/lib/services/repository";

export async function GET() {
  try {
    await requireAdminSession();
    const categories = await listServiceCategories();
    return NextResponse.json({ categories }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "No se pudieron cargar las categorías." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const category = await upsertServiceCategory({
      name: String(body.name ?? ""),
      description: String(body.description ?? ""),
      sortOrder: body.sortOrder as number | string | undefined,
      status: body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar la categoría.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdminSession();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown> & { id?: string };
    if (!body.id) {
      return NextResponse.json({ error: "Falta el identificador de la categoría." }, { status: 400 });
    }

    const category = await updateServiceCategory(body.id, {
      name: String(body.name ?? ""),
      description: String(body.description ?? ""),
      sortOrder: body.sortOrder as number | string | undefined,
      status: body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    });
    return NextResponse.json({ category }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar la categoría.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
