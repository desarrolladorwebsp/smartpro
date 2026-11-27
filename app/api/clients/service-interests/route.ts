import { NextResponse } from "next/server";
import { getCurrentAdminSession } from "@/lib/auth";
import { parseCommercialClientId } from "@/lib/clients/commercial-clients";
import { parseClientServiceInterests } from "@/lib/clients/service-interests";
import { prisma } from "@/lib/db";

export async function PATCH(request: Request) {
  if (!await getCurrentAdminSession()) {
    return NextResponse.json({ error: "Inicia sesión para editar los servicios de interés." }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const client = typeof body?.clientKey === "string" ? parseCommercialClientId(body.clientKey) : null;
  const services = parseClientServiceInterests(body?.services);
  if (!client || client.id.length > 191 || !services) {
    return NextResponse.json({ error: "Revisa el cliente y los servicios seleccionados." }, { status: 400 });
  }

  try {
    if (!prisma) throw new Error("Base de datos no disponible.");
    const where = { id: client.id, deletedAt: null };
    const data = { serviceInterests: services };
    const result = client.kind === "business"
      ? await prisma.business.updateMany({ where, data })
      : await prisma.client.updateMany({ where: { ...where, businessId: null }, data });
    if (result.count === 0) return NextResponse.json({ error: "El cliente no existe." }, { status: 404 });
    return NextResponse.json({ services });
  } catch (error) {
    console.error("[smartpro:clientes:servicios-de-interes]", error);
    return NextResponse.json({ error: "No se pudieron guardar los servicios de interés." }, { status: 500 });
  }
}
