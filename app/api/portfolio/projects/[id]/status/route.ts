import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { setPortfolioProjectStatus } from "@/lib/portfolio/repository";
import { parsePortfolioStatus } from "@/lib/portfolio/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar el estado." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const project = await setPortfolioProjectStatus(id, parsePortfolioStatus(body.status, "DRAFT"));
    return NextResponse.json({ project }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar el estado.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
