import type { CalendarLink, CalendarActivity } from "@/components/admin/calendar-types";
import type { PrismaClient } from "@prisma/client";
import { getAppUrl } from "./app-url";
import { parseCommercialClientId } from "./clients/commercial-clients";
import { listAssignableExecutives } from "./executives/repository";
import { renderCorporateEmail } from "./email/template";
import { sendEmail, type SendEmailInput } from "./email/resend";
import { buildZoomInvitationEmail } from "./email/zoom-invitation";

export type NotificationStatus = "sent" | "failed";
export type ActivityNotices = { client?: NotificationStatus; internal?: NotificationStatus };
export type NotificationPlan = Awaited<ReturnType<typeof planCalendarNotifications>>;

const meetingCopy = "contacto@smartpro.cl";
const dateFormat = new Intl.DateTimeFormat("es-CL", { dateStyle: "full", timeZone: "UTC" });
const validEmail = /^[^\s@,<>;]+@[^\s@,<>;]+\.[^\s@,<>;]+$/;

export class CalendarInputError extends Error {}

export async function planCalendarNotifications(
  db: PrismaClient,
  form: FormData,
  link: CalendarLink,
  zoom: boolean,
  savedEmail = "",
) {
  const wantsClient = form.get("sendInvitation") === "on";
  const wantsParticipants = form.get("notifyParticipants") === "on";
  const participantIds = [...new Set(form.getAll("participantIds"))];
  if (participantIds.length > 49 || participantIds.some((id) => typeof id !== "string" || !id || id.length > 191)) {
    throw new CalendarInputError("Revisa los participantes seleccionados.");
  }
  const ids = (participantIds as string[]).sort();
  const participants = ids.length ? (await listAssignableExecutives()).filter(({ id }) => ids.includes(id)) : [];
  if (participants.length !== ids.length) {
    throw new CalendarInputError("Algún participante ya no está disponible. Revisa la selección.");
  }
  const linked = link.clientKey && parseCommercialClientId(link.clientKey);
  const contactId = link.contactId || (linked && linked.kind === "person" ? linked.id : null);
  const contact = contactId && !savedEmail && !wantsClient
    ? await db.client.findUnique({ where: { id: contactId, deletedAt: null }, select: { email: true } }) : null;
  const recipient = form.get("invitationEmail");
  const clientEmail = (wantsClient && typeof recipient === "string" ? recipient : savedEmail || contact?.email || "").trim().toLowerCase();
  if (wantsClient && (clientEmail.length > 254 || !validEmail.test(clientEmail))) {
    throw new CalendarInputError("Escribe un correo válido para el cliente.");
  }
  const internal = wantsParticipants ? [
    ...(zoom ? [meetingCopy] : []),
    ...participants.map(({ email }) => email.trim().toLowerCase()).filter(Boolean),
  ] : [];
  if (wantsParticipants && internal.length === 0) {
    throw new CalendarInputError("Selecciona al menos un participante para notificar.");
  }
  return { targets: { clientEmail, participantIds: ids }, recipient: wantsClient ? clientEmail : "", internal };
}

export function internalCalendarRecipients(plan: NotificationPlan) {
  const internal = new Set(plan.internal);
  const clientAlsoInternal = internal.delete(plan.recipient);
  const [to, ...bcc] = internal;
  return { to, bcc: bcc.length ? bcc : undefined, clientAlsoInternal };
}

export async function sendCalendarEmail(input: SendEmailInput): Promise<NotificationStatus> {
  try {
    return (await sendEmail(input)).delivered ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

function buildActivityEmail(activity: CalendarActivity, change: "created" | "updated" | "deleted", internal: boolean) {
  if ("joinUrl" in activity && change === "updated") return buildZoomInvitationEmail(activity, getAppUrl(), true);
  const label = "joinUrl" in activity ? "Reunión de Zoom" : "Recordatorio";
  const status = change === "deleted" ? ("joinUrl" in activity ? "cancelada" : "cancelado") :
    change === "updated" ? "actualizado" : "agendado";
  const title = `${label} ${status}`;
  const details = [{ label: "Fecha", value: dateFormat.format(new Date(activity.date + "T00:00:00Z")) }];
  if (activity.time) details.push({ label: "Hora de Chile", value: activity.time });
  const subject = `${title} · SmartPro`;
  return {
    subject,
    ...renderCorporateEmail({
      appUrl: getAppUrl(), title: subject, heading: title, greeting: "Hola,", details,
      highlight: "joinUrl" in activity ? { label: "Reunión", value: activity.title }
        : internal ? { label: "Nota", value: activity.note } : undefined,
      intro: change === "deleted"
        ? "La actividad quedó cancelada. Si la guardaste en tu calendario personal, puedes quitarla allí."
        : "Te compartimos los datos de la actividad.",
    }),
  };
}

export async function notifyCalendarActivity(
  activity: CalendarActivity,
  change: "created" | "updated" | "deleted",
  plan: NotificationPlan,
): Promise<ActivityNotices> {
  const internal = internalCalendarRecipients(plan);
  async function deliver(to: string, isInternal: boolean, bcc?: string[]) {
    try {
      return await sendCalendarEmail({ ...buildActivityEmail(activity, change, isInternal), to, bcc });
    } catch {
      return "failed" as const;
    }
  }
  const [clientStatus, internalStatus] = await Promise.all([
    plan.recipient ? deliver(plan.recipient, false) : undefined,
    internal.to ? deliver(internal.to, true, internal.bcc) : undefined,
  ]);
  return { client: clientStatus, internal: internalStatus ?? (internal.clientAlsoInternal ? clientStatus : undefined) };
}
