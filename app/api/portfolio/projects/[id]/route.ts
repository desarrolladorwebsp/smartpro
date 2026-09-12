import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { deletePortfolioProject, getPortfolioProject, updatePortfolioProject } from "@/lib/portfolio/repository";
import { parsePortfolioProjectInput } from "@/lib/portfolio/validation";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No se pudo cargar el proyecto." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const project = await getPortfolioProject(id);
    return NextResponse.json({ project }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo cargar el proyecto.";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar el proyecto." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const project = await updatePortfolioProject(id, parsePortfolioProjectInput(body));
    return NextResponse.json({ project }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar el proyecto.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No se pudo eliminar el proyecto." }, { status: 401 });
  }

  try {
    const { id } = await params;
    await deletePortfolioProject(id);
    return NextResponse.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo eliminar el proyecto.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
