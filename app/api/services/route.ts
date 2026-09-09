import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import {
  getCatalogTree,
  listServiceCategories,
  listServicePlans,
  listServiceSubcategories,
  upsertServicePlan,
} from "@/lib/services/repository";
import { parseServicePlanPayload } from "@/lib/services/types";

export async function GET() {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No tienes permisos para ver servicios." }, { status: 401 });
  }

  try {
    const [tree, categories, subcategories, plans] = await Promise.all([
      getCatalogTree(),
      listServiceCategories(),
      listServiceSubcategories(),
      listServicePlans(),
    ]);

    return NextResponse.json(
      { tree, categories, subcategories, plans },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[smartpro:services:read]", error);
    return NextResponse.json({ error: "No se pudo cargar el catálogo de servicios." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const payload = parseServicePlanPayload(body);
    const plan = await upsertServicePlan({
      ...payload,
      items: payload.items ?? [],
    });

    return NextResponse.json({ plan }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo registrar el servicio.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
