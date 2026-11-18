"use server";

import { getCurrentAdminSession } from "@/lib/auth";
import { parseCommercialClientId } from "@/lib/clients/commercial-clients";
import type { CalendarLink } from "@/components/admin/calendar-types";
import { Prisma } from "@prisma/client";
import { createZoomMeeting, zoomCalendarConfig } from "@/lib/zoom-calendar";
import { prisma } from "@/lib/db";

async function resolveCalendarLink(form: FormData): Promise<CalendarLink | null> {
  const clientKey = form.get("clientKey") || null;
  const contactId = form.get("contactId") || null;
  if (!clientKey) return contactId ? null : { clientKey: null, contactId: null };
  if (!prisma || typeof clientKey !== "string" || clientKey.length > 191 ||
      (contactId !== null && (typeof contactId !== "string" || contactId.length > 191))) return null;
  const client = parseCommercialClientId(clientKey);
  if (!client) return null;

  if (client.kind === "business") {
    const account = await prisma.business.findUnique({ where: { id: client.id }, select: { id: true } });
    if (!account) return null;
    if (contactId && !await prisma.client.findFirst({ where: { id: contactId, businessId: account.id }, select: { id: true } })) return null;
  } else {
    if (contactId && contactId !== client.id) return null;
    if (!await prisma.client.findFirst({ where: { id: client.id, businessId: null }, select: { id: true } })) return null;
  }
  return { clientKey, contactId };
}

export async function createCalendarReminder(form: FormData) {
  const session = await getCurrentAdminSession();
  if (!session) return { error: "Inicia sesión para guardar el recordatorio." };

  const date = form.get("date");
  const note = form.get("note");
  const time = form.get("time");
  if (typeof time !== "string" || !/^(09|1[0-9]):(00|30)$/.test(time)) {
    return { error: "Elige un horario válido." };
  }
  const content = typeof note === "string" ? note.trim() : "";
  if (!content || content.length > 4000) return { error: "Escribe una nota de hasta 4.000 caracteres." };
  if (typeof date !== "string" || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(date)) return { error: "Elige una fecha válida." };
  const reminderDate = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(reminderDate.getTime()) || reminderDate.toISOString().slice(0, 10) !== date) {
    return { error: "Elige una fecha válida." };
  }

  try {
    if (!prisma) throw new Error("Base de datos no disponible.");
    const link = await resolveCalendarLink(form);
    if (!link) return { error: "Revisa el cliente y el contacto seleccionados." };
    const reminder = await prisma.calendarReminder.create({
      data: { ownerEmail: session.email.toLowerCase(), date: reminderDate, time, note: content, ...link },
      select: { id: true, note: true },
    });
    return { reminder: { ...reminder, ...link, date, time } };
  } catch (error) {
    console.error("[smartpro:calendario] No se pudo guardar el recordatorio.", error);
    return { error: "No se pudo guardar el recordatorio. Inténtalo de nuevo." };
  }
}


export async function bookCalendarZoomMeeting(form: FormData) {
  const session = await getCurrentAdminSession();
  if (!session) return { error: "Inicia sesión para agendar." };
  const config = zoomCalendarConfig();
  if (!config) return { error: "Falta conectar la cuenta de Zoom." };
  if (!prisma) return { error: "La base de datos no está disponible." };

  const date = form.get("date");
  const time = form.get("time");
  const title = String(form.get("title") ?? "").trim();
  const duration = Number(form.get("duration"));
  if (typeof date !== "string" || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(date) ||
      typeof time !== "string" || !/^(09|1[0-9]):(00|30)$/.test(time) ||
      !title || title.length > 191 || ![15, 30, 40].includes(duration)) {
    return { error: "Revisa el horario, el título y la duración." };
  }
  const meetingDate = new Date(date + "T00:00:00Z");
  const now = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Santiago", dateStyle: "short", timeStyle: "short", hourCycle: "h23",
  }).format(new Date()).replace(" ", "T");
  if (!Number.isFinite(meetingDate.getTime()) || meetingDate.toISOString().slice(0, 10) !== date || date + "T" + time <= now) {
    return { error: "Elige una fecha y hora futuras." };
  }

  const ownerEmail = session.email.toLowerCase();
  try {
    const link = await resolveCalendarLink(form);
    if (!link) return { error: "Revisa el cliente y el contacto seleccionados." };
    const meeting = await prisma.calendarZoomMeeting.create({
      data: { ownerEmail, host: config.host, date: meetingDate, time, title, duration, ...link },
    });
    const zoom = await createZoomMeeting(config, { date, time, title, duration });
    if (zoom.status === "rejected") {
      await prisma.calendarZoomMeeting.delete({ where: { id: meeting.id } });
      return { error: zoom.error };
    }
    if (zoom.status === "unknown") {
      return { error: "Zoom no confirmó el resultado. Revisa las reuniones de la cuenta anfitriona antes de volver a agendar." };
    }
    await prisma.calendarZoomMeeting.update({
      where: { id: meeting.id }, data: { zoomId: zoom.zoomId, joinUrl: zoom.joinUrl },
    });
    return { meeting: { id: meeting.id, date, time, title, duration, ...link, joinUrl: zoom.joinUrl } };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await prisma.calendarZoomMeeting.findUnique({
        where: { host_date_time: { host: config.host, date: meetingDate, time } },
      });
      if (existing?.ownerEmail === ownerEmail && existing.joinUrl) {
        const { id, title, duration, clientKey, contactId, joinUrl } = existing;
        return { meeting: { id, date, time, title, duration, clientKey, contactId, joinUrl } };
      }
      return { error: "Ese horario ya está ocupado o tiene una reserva pendiente de confirmar." };
    }
    console.error("[smartpro:calendario] Error al guardar la reserva de Zoom.", error);
    return { error: "No se pudo completar el registro. Revisa el calendario y la cuenta de Zoom antes de volver a reservar." };
  }
}
