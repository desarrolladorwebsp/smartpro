import { NextResponse } from "next/server";

import { normalizeEmail, requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createExecutiveInvitation } from "@/lib/executives/invitations";
import { parseExecutiveInvite } from "@/lib/executives/invitation-validation";

export async function POST(request: Request) {
  let session;

  try {
    session = await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  if (!prisma) {
    return NextResponse.json({ error: "No hay conexión a la base de datos." }, { status: 503 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, string>;
    const parsed = parseExecutiveInvite(body);

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const inviter = await prisma.user.findUnique({
      where: { email: normalizeEmail(session.email) },
      select: { id: true },
    });

    if (!inviter) {
      return NextResponse.json({ error: "No se pudo identificar al administrador." }, { status: 401 });
    }

    const result = await createExecutiveInvitation(parsed.data, inviter.id);

    return NextResponse.json(
      {
        email: result.email,
        expiresAt: result.expiresAt,
        emailDelivered: result.emailDelivered,
        message: result.emailDelivered
          ? "Invitación enviada correctamente."
          : "Invitación creada, pero el correo no pudo enviarse. Revisa la configuración de email.",
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo enviar la invitación.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
