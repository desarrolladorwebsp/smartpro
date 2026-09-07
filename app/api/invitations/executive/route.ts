import { NextResponse } from "next/server";

import { getValidInvitationByToken } from "@/lib/executives/invitations";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim() ?? "";

  if (!token) {
    return NextResponse.json({ error: "Token de invitación inválido." }, { status: 400 });
  }

  try {
    const invitation = await getValidInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json({ error: "La invitación no es válida, expiró o ya fue utilizada." }, { status: 404 });
    }

    return NextResponse.json({ invitation }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "No se pudo validar la invitación." }, { status: 500 });
  }
}
