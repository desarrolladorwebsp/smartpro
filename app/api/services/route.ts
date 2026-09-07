import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import {
  getCatalogTree,
  listServiceCategories,
  listServicePlans,
  listServiceSubcategories,
  upsertServicePlan,
} from "@/lib/services/repository";

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
    const plan = await upsertServicePlan({
      subcategoryId: String(body.subcategoryId ?? ""),
      name: String(body.name ?? ""),
      price: body.price as number | string,
      pricePrefix: String(body.pricePrefix ?? ""),
      taxLabel: String(body.taxLabel ?? ""),
      taxRate: body.taxRate as number | string | undefined,
      summary: String(body.summary ?? ""),
      badge: String(body.badge ?? ""),
      note: String(body.note ?? ""),
      featureGroupTitle: String(body.featureGroupTitle ?? ""),
      highlighted: Boolean(body.highlighted),
      sortOrder: body.sortOrder as number | string | undefined,
      status: body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      icon: String(body.icon ?? ""),
      externalLink: String(body.externalLink ?? ""),
      items: Array.isArray(body.items) ? (body.items as Array<{ label?: string }>) : [],
    });

    return NextResponse.json({ plan }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo registrar el servicio.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
