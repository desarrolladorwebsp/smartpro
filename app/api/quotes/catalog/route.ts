import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { listQuoteCatalog } from "@/lib/quotes/catalog";

export async function GET() {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No se pudo cargar el catálogo." }, { status: 401 });
  }

  try {
    const catalog = await listQuoteCatalog();
    return NextResponse.json({ catalog }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[smartpro:quotes:catalog]", error);
    return NextResponse.json({ error: "No se pudo cargar el catálogo de servicios." }, { status: 500 });
  }
}
