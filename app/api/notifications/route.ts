import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { countUnreadAdminNotifications, listAdminNotifications } from "@/lib/notifications/repository";
import { isAdminNotificationType } from "@/lib/notifications/types";

export async function GET(request: Request) {
  try {
    await requireAdminSession();
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
    const [notifications, unreadCount] = await Promise.all([
      listAdminNotifications({
        unreadOnly,
        type,
        query,
        limit: Number.isFinite(limitParam) ? limitParam : 200,
      }),
      countUnreadAdminNotifications(),
    ]);

    return NextResponse.json(
      { notifications, unreadCount },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[smartpro:notifications:list]", error);
    return NextResponse.json({ error: "No se pudieron cargar las notificaciones." }, { status: 500 });
  }
}
