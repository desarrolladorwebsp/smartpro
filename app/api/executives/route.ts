import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { createExecutive, listExecutives } from "@/lib/executives/repository";
import { parseExecutiveRegistration } from "@/lib/executives/validation";

export async function GET() {
  let session;

  try {
    session = await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No se pudo cargar ejecutivos." }, { status: 401 });
  }

  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  try {
    const executives = await listExecutives();
    return NextResponse.json(
      { executives },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch {
    return NextResponse.json({ error: "No se pudo cargar ejecutivos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let session;

  try {
    session = await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No se pudo registrar el ejecutivo." }, { status: 401 });
  }

  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, string>;
    const parsed = parseExecutiveRegistration(body);

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const executive = await createExecutive(parsed.data);
    return NextResponse.json({ executive }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo registrar el ejecutivo.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
