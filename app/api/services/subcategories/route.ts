import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { listServiceSubcategories, updateServiceSubcategory, upsertServiceSubcategory } from "@/lib/services/repository";

export async function GET() {
  try {
    await requireAdminSession();
    const subcategories = await listServiceSubcategories();
    return NextResponse.json({ subcategories }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "No se pudieron cargar las subcategorías." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const subcategory = await upsertServiceSubcategory({
      categoryId: String(body.categoryId ?? ""),
      name: String(body.name ?? ""),
      sortOrder: body.sortOrder as number | string | undefined,
      status: body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    });
    return NextResponse.json({ subcategory }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar la subcategoría.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdminSession();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown> & { id?: string };
    if (!body.id) {
      return NextResponse.json({ error: "Falta el identificador de la subcategoría." }, { status: 400 });
    }

    const subcategory = await updateServiceSubcategory(body.id, {
      name: String(body.name ?? ""),
      sortOrder: body.sortOrder as number | string | undefined,
      status: body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    });
    return NextResponse.json({ subcategory }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar la subcategoría.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
