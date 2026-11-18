import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { sendEmail, type SendEmailInput } from "./resend";

export const ZOOM_INVITATION_TAG = "calendar_zoom_meeting";

const deliveryEvents = {
  "email.delivered": { status: "DELIVERED", failure: null },
  "email.bounced": { status: "FAILED", failure: "El servidor de correo del cliente rechazó la invitación." },
  "email.failed": { status: "FAILED", failure: "Resend informó un error de envío." },
  "email.suppressed": { status: "FAILED", failure: "Resend bloqueó el envío a esta dirección." },
} as const;

const deliveryEventSchema = z.object({
  type: z.enum(["email.delivered", "email.bounced", "email.failed", "email.suppressed"]),
  created_at: z.string().datetime({ offset: true }),
  data: z.object({
    email_id: z.string().min(1).max(191),
    to: z.tuple([z.string().min(1).max(254)]),
    tags: z.object({ [ZOOM_INVITATION_TAG]: z.string().min(1).max(191).optional() }).optional(),
  }),
});

export async function recordZoomInvitationDelivery(db: PrismaClient, payload: unknown) {
  const parsed = deliveryEventSchema.safeParse(payload);
  if (!parsed.success) return;

  const event = parsed.data;
  const emailId = event.data.email_id;
  const meetingId = event.data.tags?.[ZOOM_INVITATION_TAG];
  const { status, failure } = deliveryEvents[event.type];
  const eventAt = new Date(event.created_at);

  // The tag can link a notification that arrived before the send response.
  // Only a newer terminal event can replace the saved outcome.
  await db.calendarZoomMeeting.updateMany({
    where: {
      clientInvitationEmail: event.data.to[0].trim().toLowerCase(),
      clientInvitationStatus: { not: null },
      AND: [
        { OR: [
          { clientInvitationResendId: emailId },
          ...(meetingId ? [{ id: meetingId, clientInvitationResendId: null }] : []),
        ] },
        { OR: [{ clientInvitationEventAt: null }, { clientInvitationEventAt: { lt: eventAt } }] },
      ],
    },
    data: {
      clientInvitationResendId: emailId,
      clientInvitationStatus: status,
      clientInvitationEventAt: eventAt,
      clientInvitationFailure: failure,
    },
  });
}

export async function sendTrackedZoomInvitation(db: PrismaClient, meetingId: string, input: SendEmailInput | null) {
  const result = input ? await sendEmail(input).catch(() => null) : null;
  const accepted = result?.delivered === true;

  try {
    if (result?.delivered && result.id) {
      await db.calendarZoomMeeting.updateMany({
        where: { id: meetingId, clientInvitationResendId: null },
        data: { clientInvitationResendId: result.id },
      });
    } else if (!result || (!result.delivered && !result.uncertain)) {
      await db.calendarZoomMeeting.updateMany({
        where: { id: meetingId, clientInvitationStatus: "PENDING", clientInvitationEventAt: null },
        data: {
          clientInvitationStatus: "FAILED",
          clientInvitationFailure: "El servicio de correo no aceptó el envío.",
        },
      });
    }

    const delivery = await db.calendarZoomMeeting.findUniqueOrThrow({
      where: { id: meetingId },
      select: { clientInvitationStatus: true, clientInvitationFailure: true },
    });
    return { delivery, accepted };
  } catch (error) {
    console.error("[smartpro:zoom-invitation] No se pudo consultar o guardar el estado de entrega.", error);
    return { delivery: { clientInvitationStatus: "PENDING" as const, clientInvitationFailure: null }, accepted };
  }
}
