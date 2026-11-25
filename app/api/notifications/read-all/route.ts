import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { markAllDashboardNotificationsRead } from "@/lib/notifications/dashboard";

export async function POST() {
  let session;
  try {
    session = await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No se pudieron marcar las notificaciones." }, { status: 401 });
  }

  try {
    const updated = await markAllDashboardNotificationsRead(session);
    return NextResponse.json({ updated }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[smartpro:notifications:read-all]", error);
    return NextResponse.json({ error: "No se pudieron marcar las notificaciones." }, { status: 500 });
  }
}
