import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { createClientRecord, listClients, updateClientRecord } from "@/lib/clients/repository";

export async function GET() {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No se pudo cargar clientes." }, { status: 401 });
  }

  try {
    const clients = await listClients();
    return NextResponse.json(
      { clients },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch {
    return NextResponse.json({ error: "No se pudo cargar clientes." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();
    const body = (await request.json().catch(() => ({}))) as Record<string, string>;

    const client = await createClientRecord({
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
      interestServiceId: body.interestServiceId,
      interestSubcategoryId: body.interestSubcategoryId,
      interestPlanId: body.interestPlanId,
    });

    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar el cliente.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdminSession();
    const body = (await request.json().catch(() => ({}))) as Record<string, string> & { id?: string };

    if (!body.id) {
      return NextResponse.json({ error: "Falta el identificador del cliente." }, { status: 400 });
    }

    const client = await updateClientRecord(body.id, {
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
      interestServiceId: body.interestServiceId,
      interestSubcategoryId: body.interestSubcategoryId,
      interestPlanId: body.interestPlanId,
    });

    return NextResponse.json({ client }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar el cliente.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
