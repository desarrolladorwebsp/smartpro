import { NextResponse } from "next/server";
import { getCurrentAdminSession } from "@/lib/auth";
import { accountApiError, hideCommercialClient, updateAccount } from "@/lib/clients/account-repository";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentAdminSession())) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  try {
    const { id } = await params;
    return NextResponse.json({ account: await updateAccount(id, await request.json()) });
  } catch (error) {
    const result = accountApiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentAdminSession();
  if (!session) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (body?.confirmed !== true || (body.kind !== "business" && body.kind !== "person")) {
    return NextResponse.json({ error: "Confirma la eliminación del cliente." }, { status: 400 });
  }

  try {
    const { id } = await params;
    if (!(await hideCommercialClient(id, body.kind, session.email))) {
      return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[smartpro:clientes] No se pudo ocultar el cliente.", error);
    return NextResponse.json({ error: "No se pudo eliminar el cliente. Vuelve a intentarlo." }, { status: 500 });
  }
}
