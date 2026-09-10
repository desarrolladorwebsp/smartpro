import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { registerInitialContact, type InitialContactPayload } from "@/lib/clients/repository";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession();
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as Partial<InitialContactPayload>;

    const contact = await registerInitialContact(
      id,
      {
        origin: body.origin as InitialContactPayload["origin"],
        quoteMotive: String(body.quoteMotive ?? ""),
        firstName: String(body.firstName ?? ""),
        lastName: String(body.lastName ?? ""),
        phone: String(body.phone ?? ""),
        email: String(body.email ?? ""),
        companyName: String(body.companyName ?? ""),
        website: String(body.website ?? ""),
        socialMedia: String(body.socialMedia ?? ""),
        observation: String(body.observation ?? ""),
        interestServiceId: body.interestServiceId,
        interestSubcategoryId: body.interestSubcategoryId,
        interestPlanId: body.interestPlanId,
      },
      session.email,
    );

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo registrar el contacto inicial.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
