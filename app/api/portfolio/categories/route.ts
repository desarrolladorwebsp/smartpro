import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { listPortfolioCategories } from "@/lib/portfolio/repository";

export async function GET() {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No se pudieron cargar los servicios de portafolio." }, { status: 401 });
  }

  try {
    const categories = await listPortfolioCategories();
    return NextResponse.json({ categories }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[smartpro:portfolio:categories]", error);
    return NextResponse.json({ error: "No se pudieron cargar los servicios de portafolio." }, { status: 500 });
  }
}
