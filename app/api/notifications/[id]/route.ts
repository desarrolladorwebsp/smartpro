import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { markDashboardNotificationRead } from "@/lib/notifications/dashboard";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar la notificación." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const notification = await markDashboardNotificationRead(session, id);

    if (!notification) {
      return NextResponse.json({ error: "La notificación no existe." }, { status: 404 });
    }

    return NextResponse.json({ notification }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[smartpro:notifications:read]", error);
    return NextResponse.json({ error: "No se pudo actualizar la notificación." }, { status: 500 });
  }
}
