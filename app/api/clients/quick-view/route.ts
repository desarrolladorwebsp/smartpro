import { NextResponse } from "next/server";

import { getCurrentAdminSession } from "@/lib/auth";
import { parseCommercialClientId } from "@/lib/clients/commercial-clients";
import { listClientNotes } from "@/lib/clients/repository";
import { prisma } from "@/lib/db";
import { listQuotes } from "@/lib/quotes/repository";
import { listSendpulseConversationOptions } from "@/lib/sendpulse/conversation-access";

export async function GET(request: Request) {
  const session = await getCurrentAdminSession();
  if (!session) return NextResponse.json({ error: "Inicia sesión para consultar al cliente." }, { status: 401 });

  const clientKey = new URL(request.url).searchParams.get("cliente") ?? "";
  const client = parseCommercialClientId(clientKey);
  if (!client || clientKey.length > 191) {
    return NextResponse.json({ error: "Cliente inválido." }, { status: 400 });
  }

  try {
    if (!prisma) throw new Error("Base de datos no disponible.");
    const visible = client.kind === "business"
      ? await prisma.business.findUnique({ where: { id: client.id, deletedAt: null }, select: { id: true, origin: true } })
      : await prisma.client.findUnique({ where: { id: client.id, businessId: null, deletedAt: null }, select: { id: true } });
    if (!visible) return NextResponse.json({ error: "El cliente no existe." }, { status: 404 });
    const businessId = client.kind === "business" ? client.id : undefined;
    const clientId = businessId ? "" : client.id;
    const [notes, quotes, meetings, sendpulseOptions] = await Promise.all([
      listClientNotes(clientId, businessId, 1),
      listQuotes(businessId ? { businessId } : { clientId, individualOnly: true }),
      prisma.calendarZoomMeeting.findMany({
        where: { clientKey, ownerEmail: session.email.toLowerCase(), joinUrl: { not: null } },
        select: { id: true, date: true, time: true, title: true, duration: true, joinUrl: true },
        orderBy: [{ date: "asc" }, { time: "asc" }],
      }),
      businessId && "origin" in visible && visible.origin === "SENDPULSE" ? listSendpulseConversationOptions(businessId, session) : [],
    ]);

    return NextResponse.json({
      note: notes[0] ? { title: notes[0].title, content: notes[0].content, createdAt: notes[0].createdAt } : null,
      quotes: quotes.map(({ id, number, createdAt, total, status }) => ({ id, number, createdAt, total, status })),
      meetings: meetings.map((meeting) => ({ ...meeting, date: meeting.date.toISOString().slice(0, 10) })),
      sendpulseOptions,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[smartpro:clientes:ficha-rapida] Error al cargar la ficha", error);
    return NextResponse.json({ error: "No se pudo cargar la ficha. Intenta nuevamente." }, { status: 500 });
  }
}
