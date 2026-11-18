"use server";

import { getCurrentAdminSession } from "@/lib/auth";
import { parseCommercialClientId } from "@/lib/clients/commercial-clients";
import type { CalendarLink, CalendarZoomMeeting } from "@/components/admin/calendar-types";
import { Prisma } from "@prisma/client";
import { createZoomMeeting, zoomCalendarConfig } from "@/lib/zoom-calendar";
import { prisma } from "@/lib/db";
import { listAssignableExecutives } from "@/lib/executives/repository";
import { sendEmail, type SendEmailInput } from "@/lib/email/resend";
import { buildZoomInvitationEmail } from "@/lib/email/zoom-invitation";
import { ZOOM_INVITATION_TAG, sendTrackedZoomInvitation } from "@/lib/email/zoom-delivery";

const ZOOM_INVITATION_COPY = "contacto@smartpro.cl";

type InvitationStatus = "sent" | "failed";
type ZoomBookingResult =
  | { meeting: CalendarZoomMeeting; internalInvitation?: InvitationStatus; existing?: boolean }
  | { meeting?: never; error: string };

async function sendInvitationEmail(input: SendEmailInput): Promise<InvitationStatus> {
  try {
    const result = await sendEmail(input);
    return result.delivered ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

async function inviteZoomMeetingAttendees(
  db: NonNullable<typeof prisma>,
  meeting: Parameters<typeof buildZoomInvitationEmail>[0] & { id: string },
  recipient: string,
  participantEmails: string[],
) {
  try {
    const email = buildZoomInvitationEmail(meeting);
    const customerAddress = recipient.toLowerCase();
    const internalAddresses = new Set([ZOOM_INVITATION_COPY, ...participantEmails]);
    const customerAlsoInternal = internalAddresses.delete(customerAddress);
    const [internalTo, ...internalBcc] = internalAddresses;
    const [invitation, internalInvitation] = await Promise.all([
      recipient ? sendTrackedZoomInvitation(db, meeting.id, {
        ...email, to: recipient, tags: [{ name: ZOOM_INVITATION_TAG, value: meeting.id }],
      }) : undefined,
      internalTo ? sendInvitationEmail({
        ...email, to: internalTo, bcc: internalBcc.length ? internalBcc : undefined,
      }) : undefined,
    ]);
    const internalDelivery = customerAlsoInternal && invitation?.delivery.clientInvitationStatus === "FAILED"
      ? "failed" as const
      : internalInvitation ?? (customerAlsoInternal && invitation?.accepted ? "sent" as const : undefined);
    return { ...invitation?.delivery, internalInvitation: internalDelivery };
  } catch {
    const invitation = recipient ? await sendTrackedZoomInvitation(db, meeting.id, null) : undefined;
    return { ...invitation?.delivery, internalInvitation: "failed" as const };
  }
}

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


export async function bookCalendarZoomMeeting(form: FormData): Promise<ZoomBookingResult> {
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

  const wantsInvitation = form.get("sendInvitation") === "on";
  const rawRecipient = form.get("invitationEmail");
  const recipient = wantsInvitation && typeof rawRecipient === "string" ? rawRecipient.trim() : "";
  if (wantsInvitation && (recipient.length > 254 || !/^[^\s@,<>;]+@[^\s@,<>;]+\.[^\s@,<>;]+$/.test(recipient))) {
    return { error: "Escribe un correo válido para enviar la invitación." };
  }

  const participantIds = new Set<string>();
  for (const id of form.getAll("participantIds")) {
    if (typeof id !== "string" || !id || id.length > 191) {
      return { error: "Revisa los participantes seleccionados." };
    }
    participantIds.add(id);
  }

  const ownerEmail = session.email.toLowerCase();
  try {
    const link = await resolveCalendarLink(form);
    if (!link) return { error: "Revisa el cliente y el contacto seleccionados." };
    const participants = participantIds.size
      ? (await listAssignableExecutives()).filter(({ id }) => participantIds.has(id))
      : [];
    if (participants.length !== participantIds.size) {
      return { error: "Algún participante ya no está disponible. Actualiza el calendario y vuelve a seleccionarlo." };
    }
    const participantEmails = participants.map(({ email }) => email.trim().toLowerCase());
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
      where: { id: meeting.id },
      data: {
        zoomId: zoom.zoomId, joinUrl: zoom.joinUrl,
        ...(recipient ? { clientInvitationEmail: recipient.toLowerCase(), clientInvitationStatus: "PENDING" } : {}),
      },
    });
    const bookedMeeting = { id: meeting.id, date, time, title, duration, ...link, joinUrl: zoom.joinUrl };
    // Only the request that creates the reservation sends invitations.
    const { internalInvitation, ...delivery } = await inviteZoomMeetingAttendees(prisma, bookedMeeting, recipient, participantEmails);
    return { meeting: { ...bookedMeeting, ...delivery }, internalInvitation };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await prisma.calendarZoomMeeting.findUnique({
        where: { host_date_time: { host: config.host, date: meetingDate, time } },
      });
      if (existing?.ownerEmail === ownerEmail && existing.joinUrl) {
        const { id, title, duration, clientKey, contactId, joinUrl, clientInvitationStatus, clientInvitationFailure } = existing;
        return {
          meeting: { id, date, time, title, duration, clientKey, contactId, joinUrl, clientInvitationStatus, clientInvitationFailure },
          existing: true,
        };
      }
      return { error: "Ese horario ya está ocupado o tiene una reserva pendiente de confirmar." };
    }
    console.error("[smartpro:calendario] Error al guardar la reserva de Zoom.", error);
    return { error: "No se pudo completar el registro. Revisa el calendario y la cuenta de Zoom antes de volver a reservar." };
  }
}
