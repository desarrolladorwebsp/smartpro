import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { getClientById, updateClientRecord } from "@/lib/clients/repository";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const client = await getClientById(id);

    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ client }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "No se pudo cargar el cliente." }, { status: 401 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as Record<string, string>;

    const client = await updateClientRecord(id, {
      companyName: body.companyName,
      businessName: body.businessName,
      rut: body.rut,
      contactFirstName: body.contactFirstName,
      firstName: body.firstName,
      contactLastName: body.contactLastName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      address: body.address,
      commune: body.commune,
      city: body.city,
      region: body.region,
      website: body.website,
      notes: body.notes,
      status: (body.status as "ACTIVO" | "POTENCIAL" | "INACTIVO") ?? "ACTIVO",
    });

    return NextResponse.json({ client }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar el cliente.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
