import { NextResponse } from "next/server";

import { getCurrentAdminSession } from "@/lib/auth";
import { calendarTimeSlots, parseCalendarDate } from "@/lib/calendar-slots";
import { prisma } from "@/lib/db";
import { zoomCalendarConfig } from "@/lib/zoom-calendar";

function minutes(time: string) {
  const [hours, minute] = time.split(":").map(Number);
  return hours * 60 + minute;
}

export async function GET(request: Request) {
  const session = await getCurrentAdminSession();
  if (!session) return NextResponse.json({ error: "Inicia sesión para consultar la agenda." }, { status: 401 });

  const date = parseCalendarDate(new URL(request.url).searchParams.get("date"));
  if (!date) return NextResponse.json({ error: "Elige una fecha válida." }, { status: 400 });

  try {
    if (!prisma) throw new Error("Base de datos no disponible.");
    const ownerEmail = session.email.toLowerCase();
    const host = zoomCalendarConfig()?.host;
    const [meetings, reminders] = await Promise.all([
      prisma.calendarZoomMeeting.findMany({
        where: { date, OR: [{ ownerEmail }, ...(host ? [{ host }] : [])] },
        select: { time: true, duration: true },
      }),
      prisma.calendarReminder.findMany({
        where: { date, ownerEmail, time: { not: null } },
        select: { time: true },
      }),
    ]);

    const occupiedPeriods = [
      ...meetings.map(({ time, duration }) => {
        const start = minutes(time);
        return { start, end: start + duration };
      }),
      ...reminders.flatMap(({ time }) => time ? [{ start: minutes(time), end: minutes(time) + 1 }] : []),
    ];
    const occupied = calendarTimeSlots.filter((time) => {
      const start = minutes(time);
      return occupiedPeriods.some((period) => start < period.end && period.start < start + 30);
    });

    return NextResponse.json({ occupied }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[smartpro:calendario] Error al consultar horarios ocupados.", error);
    return NextResponse.json({ error: "No se pudieron consultar los horarios ocupados." }, { status: 500 });
  }
}
