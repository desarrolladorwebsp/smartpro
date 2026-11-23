"use server";

import { getCurrentAdminSession } from "@/lib/auth";
import { parseCommercialClientId } from "@/lib/clients/commercial-clients";
import type { CalendarActivity, CalendarLink, CalendarReminder, CalendarZoomMeeting } from "@/components/admin/calendar-types";
import { Prisma, type CalendarReminder as ReminderRow, type CalendarZoomMeeting as MeetingRow } from "@prisma/client";
import { createZoomMeeting, deleteZoomMeeting, updateZoomMeeting, zoomCalendarConfig } from "@/lib/zoom-calendar";
import { prisma } from "@/lib/db";
import { buildZoomInvitationEmail } from "@/lib/email/zoom-invitation";
import { ZOOM_INVITATION_TAG, sendTrackedZoomInvitation } from "@/lib/email/zoom-delivery";

import { parseCalendarDate } from "@/lib/calendar-slots";
import { readCalendarNotificationTargets } from "@/lib/calendar-notification-targets";
import {
  CalendarInputError, internalCalendarRecipients, notifyCalendarActivity, planCalendarNotifications, sendCalendarEmail,
  type ActivityNotices, type NotificationPlan, type NotificationStatus,
} from "@/lib/calendar-activity-notifications";

type ZoomBookingResult =
  | { meeting: CalendarZoomMeeting; internalInvitation?: NotificationStatus; existing?: boolean }
  | { meeting?: never; error: string };

const validTime = /^(09|1[0-9]):(00|30)$/;
const chileClock = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "America/Santiago", dateStyle: "short", timeStyle: "short", hourCycle: "h23",
});

function isFuture(date: string, time: string) {
  return date + "T" + time > chileClock.format(new Date()).replace(" ", "T");
}

function validActivityId(id: string) {
  return typeof id === "string" && Boolean(id.trim()) && id.length <= 191;
}

function calendarError(error: unknown, fallback: string) {
  if (error instanceof CalendarInputError) return { error: error.message };
  console.error("[smartpro:calendario]", error);
  return { error: fallback };
}

function reminderView(row: Pick<ReminderRow,
  "id" | "date" | "time" | "note" | "clientKey" | "contactId" | "notificationTargets">): CalendarReminder {
  const { id, date, time, note, clientKey, contactId, notificationTargets } = row;
  return { id, date: date.toISOString().slice(0, 10), time, note, clientKey, contactId,
    notificationTargets: readCalendarNotificationTargets(notificationTargets) };
}

function meetingView(row: Pick<MeetingRow,
  "id" | "date" | "time" | "title" | "duration" | "clientKey" | "contactId" | "notificationTargets" |
  "clientInvitationEmail" | "clientInvitationStatus" | "clientInvitationFailure">, joinUrl: string): CalendarZoomMeeting {
  const { id, date, time, title, duration, clientKey, contactId, clientInvitationStatus, clientInvitationFailure } = row;
  return { id, date: date.toISOString().slice(0, 10), time, title, duration, clientKey, contactId, joinUrl,
    clientInvitationStatus, clientInvitationFailure,
    notificationTargets: readCalendarNotificationTargets(row.notificationTargets, row.clientInvitationEmail) };
}

export async function deleteCalendarActivity(
  id: string, kind: "reminder" | "zoom", form = new FormData(),
): Promise<{ error?: string; notices?: ActivityNotices }> {
  const session = await getCurrentAdminSession();
  if (!session) return { error: "Inicia sesión para eliminar actividades." };
  if (!prisma) return { error: "Base de datos no disponible." };
  if (!validActivityId(id) || (kind !== "reminder" && kind !== "zoom")) {
    return { error: "La actividad seleccionada no es válida." };
  }

  const where = { id, ownerEmail: session.email.toLowerCase() };
  try {
    let activity: CalendarActivity;
    let plan: NotificationPlan;
    if (kind === "reminder") {
      const reminder = await prisma.calendarReminder.findFirst({ where });
      if (!reminder) return {};
      activity = reminderView(reminder);
      plan = await planCalendarNotifications(prisma, form, activity, false, activity.notificationTargets?.clientEmail);
      if (!(await prisma.calendarReminder.deleteMany({ where })).count) return {};
    } else {
      const meeting = await prisma.calendarZoomMeeting.findFirst({ where });
      if (!meeting?.joinUrl) return {};
      if (!meeting.zoomId) return { error: "La reunión no tiene un identificador registrado en Zoom." };
      activity = meetingView(meeting, meeting.joinUrl);
      plan = await planCalendarNotifications(prisma, form, activity, true, activity.notificationTargets?.clientEmail);
      const removed = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM CalendarZoomMeeting WHERE id = ${id} AND ownerEmail = ${where.ownerEmail} FOR UPDATE`;
        const current = await tx.calendarZoomMeeting.findFirst({ where });
        if (!current?.joinUrl || !current.zoomId) return null;
        const config = zoomCalendarConfig(current.host);
        if (!config) throw new CalendarInputError("Conecta la cuenta anfitriona de Zoom para eliminar esta reunión.");
        const result = await deleteZoomMeeting(config, current.zoomId);
        if (result.error) throw new CalendarInputError(result.error);
        await tx.calendarZoomMeeting.delete({ where });
        return meetingView(current, current.joinUrl);
      }, { timeout: 30_000 });
      if (!removed) return {};
      activity = removed;
    }
    const notices = await notifyCalendarActivity(activity, "deleted", plan);
    return notices.client || notices.internal ? { notices } : {};
  } catch (error) {
    return calendarError(error, "No se pudo eliminar la actividad. Vuelve a intentarlo.");
  }
}

async function inviteZoomMeetingAttendees(
  db: NonNullable<typeof prisma>,
  meeting: CalendarZoomMeeting,
  plan: NotificationPlan,
) {
  const { recipient } = plan;
  const { to: internalTo, bcc: internalBcc, clientAlsoInternal: customerAlsoInternal } = internalCalendarRecipients(plan);
  try {
    const email = buildZoomInvitationEmail(meeting);
    const [invitation, internalInvitation] = await Promise.all([
      recipient ? sendTrackedZoomInvitation(db, meeting.id, {
        ...email, to: recipient, tags: [{ name: ZOOM_INVITATION_TAG, value: meeting.id }],
      }) : undefined,
      internalTo ? sendCalendarEmail({
        ...email, to: internalTo, bcc: internalBcc,
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
    const account = await prisma.business.findUnique({ where: { id: client.id, deletedAt: null }, select: { id: true } });
    if (!account) return null;
    if (contactId && !await prisma.client.findFirst({ where: { id: contactId, businessId: account.id, deletedAt: null }, select: { id: true } })) return null;
  } else {
    if (contactId && contactId !== client.id) return null;
    if (!await prisma.client.findFirst({ where: { id: client.id, businessId: null, deletedAt: null }, select: { id: true } })) return null;
  }
  return { clientKey, contactId };
}

export async function createCalendarReminder(form: FormData) {
  const session = await getCurrentAdminSession();
  if (!session) return { error: "Inicia sesión para guardar el recordatorio." };

  const date = parseCalendarDate(form.get("date"));
  const time = form.get("time");
  const rawNote = form.get("note");
  const note = typeof rawNote === "string" ? rawNote.trim() : "";
  if (!date || typeof time !== "string" || !validTime.test(time)) return { error: "Elige una fecha y hora válidas." };
  if (!note || note.length > 4000) return { error: "Escribe una nota de hasta 4.000 caracteres." };

  try {
    if (!prisma) throw new Error("Base de datos no disponible.");
    const link = await resolveCalendarLink(form);
    if (!link) return { error: "Revisa el cliente y el contacto seleccionados." };
    const plan = await planCalendarNotifications(prisma, form, link, false);
    const row = await prisma.calendarReminder.create({
      data: { ownerEmail: session.email.toLowerCase(), date, time, note, ...link, notificationTargets: plan.targets },
    });
    const reminder = reminderView(row);
    return { reminder, notices: await notifyCalendarActivity(reminder, "created", plan) };
  } catch (error) {
    return calendarError(error, "No se pudo guardar el recordatorio. Inténtalo de nuevo.");
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
  const rawTitle = form.get("title");
  const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
  const duration = Number(form.get("duration"));
  if (typeof date !== "string" || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(date) ||
      typeof time !== "string" || !/^(09|1[0-9]):(00|30)$/.test(time) ||
      !title || title.length > 191 || ![15, 30, 40].includes(duration)) {
    return { error: "Revisa el horario, el título y la duración." };
  }
  const meetingDate = new Date(date + "T00:00:00Z");
  if (!parseCalendarDate(date) || !isFuture(date, time)) {
    return { error: "Elige una fecha y hora futuras." };
  }

  const ownerEmail = session.email.toLowerCase();
  try {
    const link = await resolveCalendarLink(form);
    if (!link) return { error: "Revisa el cliente y el contacto seleccionados." };
    const plan = await planCalendarNotifications(prisma, form, link, true);
    const { recipient } = plan;
    const meeting = await prisma.calendarZoomMeeting.create({
      data: { ownerEmail, host: config.host, date: meetingDate, time, title, duration, ...link, notificationTargets: plan.targets },
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
    const bookedMeeting = { id: meeting.id, date, time, title, duration, ...link, joinUrl: zoom.joinUrl, notificationTargets: plan.targets };
    // Only the request that creates the reservation sends invitations.
    const { internalInvitation, ...delivery } = await inviteZoomMeetingAttendees(prisma, bookedMeeting, plan);
    return { meeting: { ...bookedMeeting, ...delivery }, internalInvitation };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await prisma.calendarZoomMeeting.findUnique({
        where: { host_date_time: { host: config.host, date: meetingDate, time } },
      });
      if (existing?.ownerEmail === ownerEmail && existing.joinUrl) {
        return { meeting: meetingView(existing, existing.joinUrl), existing: true };
      }
      return { error: "Ese horario ya está ocupado o tiene una reserva pendiente de confirmar." };
    }
    return calendarError(error, "No se pudo completar el registro. Revisa el calendario y Zoom antes de volver a reservar.");
  }
}

function savedRecipient(
  current: CalendarLink & { notificationTargets?: unknown; clientInvitationEmail?: string | null },
  link: CalendarLink,
) {
  return current.clientKey === link.clientKey && current.contactId === link.contactId
    ? readCalendarNotificationTargets(current.notificationTargets, current.clientInvitationEmail).clientEmail : "";
}

function sameTargets(previous: unknown, targets: NotificationPlan["targets"]) {
  const saved = readCalendarNotificationTargets(previous);
  return saved.clientEmail === targets.clientEmail && saved.participantIds.join(",") === targets.participantIds.join(",");
}

export async function updateCalendarReminder(id: string, form: FormData) {
  const session = await getCurrentAdminSession();
  if (!session) return { error: "Inicia sesión para editar el recordatorio." };
  if (!prisma || !validActivityId(id)) return { error: "El recordatorio no está disponible." };
  const date = parseCalendarDate(form.get("date"));
  const time = form.get("time");
  const rawNote = form.get("note");
  const note = typeof rawNote === "string" ? rawNote.trim() : "";
  if (!date || typeof time !== "string" || (time && !validTime.test(time))) return { error: "Elige una fecha y hora válidas." };
  if (!note || note.length > 4000) return { error: "Escribe una nota de hasta 4.000 caracteres." };

  const where = { id, ownerEmail: session.email.toLowerCase() };
  try {
    const prior = await prisma.calendarReminder.findFirst({ where });
    if (!prior) return { error: "El recordatorio ya no está disponible." };
    const link = await resolveCalendarLink(form);
    if (!link) return { error: "Revisa el cliente y el contacto seleccionados." };
    const plan = await planCalendarNotifications(prisma, form, link, false, savedRecipient(prior, link));
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM CalendarReminder WHERE id = ${id} AND ownerEmail = ${where.ownerEmail} FOR UPDATE`;
      const current = await tx.calendarReminder.findFirst({ where });
      if (!current) throw new CalendarInputError("El recordatorio ya no está disponible.");
      if (!time && current.time) throw new CalendarInputError("Elige una hora válida.");
      const changed = current.date.getTime() !== date.getTime() || current.time !== (time || null) || current.note !== note ||
        current.clientKey !== link.clientKey || current.contactId !== link.contactId || !sameTargets(current.notificationTargets, plan.targets);
      const row = changed ? await tx.calendarReminder.update({
        where, data: { date, time: time || null, note, ...link, notificationTargets: plan.targets },
      }) : current;
      return { reminder: reminderView(row), changed };
    });
    const notices = result.changed ? await notifyCalendarActivity(result.reminder, "updated", plan) : undefined;
    return { reminder: result.reminder, notices };
  } catch (error) {
    return calendarError(error, "No se pudo editar el recordatorio. Vuelve a intentarlo.");
  }
}

export async function updateCalendarZoomMeeting(id: string, form: FormData) {
  const session = await getCurrentAdminSession();
  if (!session) return { error: "Inicia sesión para editar la reunión." };
  if (!prisma || !validActivityId(id)) return { error: "La reunión no está disponible." };
  const date = form.get("date");
  const parsedDate = parseCalendarDate(date);
  const time = form.get("time");
  const rawTitle = form.get("title");
  const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
  const duration = Number(form.get("duration"));
  if (typeof date !== "string" || !parsedDate || typeof time !== "string" || !validTime.test(time) ||
      !title || title.length > 191 || ![15, 30, 40].includes(duration)) {
    return { error: "Revisa el horario, el título y la duración." };
  }

  const where = { id, ownerEmail: session.email.toLowerCase() };
  try {
    const prior = await prisma.calendarZoomMeeting.findFirst({ where });
    if (!prior?.joinUrl) return { error: "La reunión ya no está disponible." };
    const link = await resolveCalendarLink(form);
    if (!link) return { error: "Revisa el cliente y el contacto seleccionados." };
    const plan = await planCalendarNotifications(prisma, form, link, true, savedRecipient(prior, link));
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM CalendarZoomMeeting WHERE id = ${id} AND ownerEmail = ${where.ownerEmail} FOR UPDATE`;
      const current = await tx.calendarZoomMeeting.findFirst({ where });
      if (!current?.joinUrl) throw new CalendarInputError("La reunión ya no está disponible.");
      const moved = current.date.getTime() !== parsedDate.getTime() || current.time !== time;
      if (moved && !isFuture(date, time)) throw new CalendarInputError("Elige una fecha y hora futuras.");
      const changedInZoom = moved || current.title !== title || current.duration !== duration;
      const changed = changedInZoom || current.clientKey !== link.clientKey || current.contactId !== link.contactId ||
        !sameTargets(current.notificationTargets, plan.targets);
      if (!changed) return { meeting: meetingView(current, current.joinUrl), changed };
      // Reserve the new slot before calling Zoom. An occupied slot fails before sending a change to Zoom.
      const row = await tx.calendarZoomMeeting.update({
        where,
        data: { date: parsedDate, time, title, duration, ...link, notificationTargets: plan.targets },
      });
      if (changedInZoom) {
        const config = zoomCalendarConfig(current.host);
        if (!config || !current.zoomId) throw new CalendarInputError("Conecta la cuenta anfitriona de Zoom para editar esta reunión.");
        const remote = await updateZoomMeeting(config, current.zoomId, { title, duration, ...(moved ? { date, time } : {}) });
        if (remote.error) throw new CalendarInputError(remote.error);
      }
      return { meeting: meetingView(row, current.joinUrl), changed };
    }, { timeout: 30_000 });
    const notices = result.changed ? await notifyCalendarActivity(result.meeting, "updated", plan) : undefined;
    return { meeting: result.meeting, notices };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "Ese horario ya está ocupado." };
    }
    return calendarError(error, "No se pudo editar la reunión. Vuelve a intentarlo.");
  }
}
