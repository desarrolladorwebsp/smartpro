import { NextResponse } from "next/server";

import { acceptExecutiveInvitation } from "@/lib/executives/invitations";
import { parseInvitationAccept } from "@/lib/executives/invitation-validation";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, string>;
    const parsed = parseInvitationAccept(body);

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const executive = await acceptExecutiveInvitation(parsed.data);

    return NextResponse.json(
      {
        executive,
        message: "Cuenta creada correctamente. Ya puedes iniciar sesión.",
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo completar la invitación.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
