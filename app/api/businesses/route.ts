import { NextResponse } from "next/server";
import { getCurrentAdminSession } from "@/lib/auth";
import { associateConfirmedBusinessClients, listBusinesses } from "@/lib/clients/business-repository";

import { createBusinessWithContacts } from "@/lib/clients/repository";

export async function GET() {
  if (!(await getCurrentAdminSession())) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  return NextResponse.json({ businesses: await listBusinesses() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!(await getCurrentAdminSession())) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  try {
    const body = await request.json();
    return NextResponse.json(await createBusinessWithContacts(body), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo guardar el negocio." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  if (!(await getCurrentAdminSession())) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  try {
    const { businessId, clientIds } = await request.json();
    if (typeof businessId !== "string" || !Array.isArray(clientIds) || clientIds.length < 1 ||
      clientIds.length > 100 || clientIds.some((id) => typeof id !== "string")) {
      throw new Error("Selecciona las fichas cuyo RUT confirmaste.");
    }
    const count = await associateConfirmedBusinessClients(businessId, [...new Set<string>(clientIds)]);
    return NextResponse.json({ count });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudieron asociar los clientes." }, { status: 400 });
  }
}
