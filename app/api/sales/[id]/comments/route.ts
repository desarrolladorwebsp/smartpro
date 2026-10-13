import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { addSaleInternalComment, listSaleInternalComments } from "@/lib/sales/comments";
import { getSaleById } from "@/lib/sales/repository";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    if (!(await getSaleById(id))) return NextResponse.json({ error: "La venta no existe." }, { status: 404 });
    const comments = await listSaleInternalComments(id);
    return NextResponse.json({ comments }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[smartpro:sales:comments:list]", error);
    return NextResponse.json({ error: "No se pudieron cargar los comentarios." }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  let session: Awaited<ReturnType<typeof requireAdminSession>>;
  try {
    session = await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    if (!(await getSaleById(id))) return NextResponse.json({ error: "La venta no existe." }, { status: 404 });
    const payload = await request.json() as { body?: unknown };
    const comment = await addSaleInternalComment(id, session.email, payload.body);
    return NextResponse.json({ comment }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar el comentario.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
