import { NextResponse } from "next/server";

import { normalizeEmail, requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createExecutive, listExecutives, softDeleteExecutive, updateExecutiveStatus } from "@/lib/executives/repository";
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

export async function PATCH(request: Request) {
  let session;
  try {
    session = await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  if (session.role !== "ADMIN") return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  try {
    const body = (await request.json().catch(() => ({}))) as { id?: unknown; status?: unknown };
    if (typeof body.id !== "string" || (body.status !== "ACTIVE" && body.status !== "INACTIVE")) {
      return NextResponse.json({ error: "Solicitud no válida." }, { status: 400 });
    }
    const target = await prisma?.user.findUnique({ where: { id: body.id }, select: { email: true, role: true, deletedAt: true } });
    if (!target || target.deletedAt || (target.role !== "EXECUTIVE" && target.role !== "ADMIN")) {
      return NextResponse.json({ error: "No se encontró el usuario." }, { status: 404 });
    }
    if (normalizeEmail(target.email) === normalizeEmail(session.email)) {
      return NextResponse.json({ error: "No puedes cambiar el estado de tu propia cuenta." }, { status: 400 });
    }
    await updateExecutiveStatus(body.id, body.status);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar el usuario.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  let session;
  try {
    session = await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  if (session.role !== "ADMIN") return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  try {
    const body = (await request.json().catch(() => ({}))) as { id?: unknown };
    if (typeof body.id !== "string" || !body.id.trim()) {
      return NextResponse.json({ error: "Identificador de usuario no válido." }, { status: 400 });
    }
    const target = await prisma?.user.findUnique({ where: { id: body.id }, select: { email: true, role: true, deletedAt: true } });
    if (!target || target.deletedAt || (target.role !== "EXECUTIVE" && target.role !== "ADMIN")) {
      return NextResponse.json({ error: "No se encontró el usuario." }, { status: 404 });
    }
    if (normalizeEmail(target.email) === normalizeEmail(session.email)) {
      return NextResponse.json({ error: "No puedes eliminar tu propia cuenta." }, { status: 400 });
    }
    await softDeleteExecutive(body.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo eliminar el usuario.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
