import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { markAllAdminNotificationsRead } from "@/lib/notifications/repository";

export async function POST() {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No se pudieron marcar las notificaciones." }, { status: 401 });
  }

  try {
    const updated = await markAllAdminNotificationsRead();
    return NextResponse.json({ updated }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[smartpro:notifications:read-all]", error);
    return NextResponse.json({ error: "No se pudieron marcar las notificaciones." }, { status: 500 });
  }
}
