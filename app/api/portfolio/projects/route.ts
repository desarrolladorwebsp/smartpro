import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { WEB_DEVELOPMENT_CATEGORY_SLUG } from "@/lib/portfolio/constants";
import { createPortfolioProject, listPortfolioProjects } from "@/lib/portfolio/repository";
import type { PortfolioProjectStatus } from "@/lib/portfolio/types";
import { parsePortfolioProjectInput } from "@/lib/portfolio/validation";

export async function GET(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No se pudieron cargar los proyectos." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const status =
      statusParam === "DRAFT" || statusParam === "PUBLISHED" || statusParam === "ARCHIVED" || statusParam === "ALL"
        ? (statusParam as PortfolioProjectStatus | "ALL")
        : undefined;

    const projects = await listPortfolioProjects({
      categorySlug: searchParams.get("category") || WEB_DEVELOPMENT_CATEGORY_SLUG,
      subcategoryId: searchParams.get("subcategory") || undefined,
      status,
      query: searchParams.get("q") || undefined,
    });

    return NextResponse.json({ projects }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[smartpro:portfolio:list]", error);
    return NextResponse.json({ error: "No se pudieron cargar los proyectos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No se pudo crear el proyecto." }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const project = await createPortfolioProject(parsePortfolioProjectInput(body));
    return NextResponse.json({ project }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear el proyecto.";
    console.error("[smartpro:portfolio:create]", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
