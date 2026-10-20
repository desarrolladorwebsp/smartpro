import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { archiveTestSale, restoreArchivedSale } from "@/lib/sales/repository";

type RouteContext = { params: Promise<{ id: string }> };

async function getAdminSession() {
  try {
    const session = await requireAdminSession();
    if (session.role !== "ADMIN") return null;
    return session;
  } catch {
    return null;
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  try {
    const { id } = await context.params;
    await archiveTestSale(id, session.email);
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo ocultar la venta.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(_request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  try {
    const { id } = await context.params;
    await restoreArchivedSale(id);
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo restaurar la venta.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
