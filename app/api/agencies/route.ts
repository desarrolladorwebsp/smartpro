import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { listAgencyProfiles, saveAgencyProfile } from "@/lib/agencies/repository";
import type { AgencyProfile } from "@/lib/agencies/types";

async function requireAdmin() {
  const session = await requireAdminSession();
  if (session.role !== "ADMIN") throw new Error("No autorizado.");
}

export async function GET() {
  try {
    await requireAdmin();
    const agencies = await listAgencyProfiles();
    return NextResponse.json({ agencies }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudieron cargar las agencias." }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json().catch(() => ({}))) as { agency?: Partial<AgencyProfile> };
    const agency = await saveAgencyProfile(body.agency ?? {});
    return NextResponse.json({ agency }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo crear la agencia." }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json().catch(() => ({}))) as { agency?: Partial<AgencyProfile> & { id?: string } };
    const id = String(body.agency?.id ?? "");
    if (!id) return NextResponse.json({ error: "Falta el identificador de agencia." }, { status: 400 });
    const agency = await saveAgencyProfile(body.agency ?? {}, id);
    return NextResponse.json({ agency }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo guardar la agencia." }, { status: 400 });
  }
}
