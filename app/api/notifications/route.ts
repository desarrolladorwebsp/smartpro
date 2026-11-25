import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { listDashboardNotifications } from "@/lib/notifications/dashboard";
import { isAdminNotificationType } from "@/lib/notifications/types";

export async function GET(request: Request) {
  let session;
  try {
    session = await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No se pudieron cargar las notificaciones." }, { status: 401 });
  }

  const url = new URL(request.url);
  const unreadOnly = url.searchParams.get("unread") === "1";
  const typeParam = url.searchParams.get("type") ?? "ALL";
  const query = url.searchParams.get("q") ?? "";
  const limitParam = Number(url.searchParams.get("limit") ?? "200");
  const type = isAdminNotificationType(typeParam) ? typeParam : "ALL";

  try {
    const data = await listDashboardNotifications(session, { unreadOnly, type, query, limit: Number.isFinite(limitParam) ? limitParam : 200 });
    return NextResponse.json(data, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[smartpro:notifications:list]", error);
    return NextResponse.json({ error: "No se pudieron cargar las notificaciones." }, { status: 500 });
  }
}
