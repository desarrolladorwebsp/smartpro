import type { CalendarInvitationDelivery } from "@prisma/client";
import type { CalendarNotificationTargets } from "@/lib/calendar-notification-targets";

export type CalendarClient = {
  id: string;
  name: string;
  contacts: { id: string; name: string; email: string }[];
};

export type CalendarParticipant = { id: string; name: string };

export type CalendarLink = { clientKey: string | null; contactId: string | null };
type CalendarRecipients = { notificationTargets?: CalendarNotificationTargets };
export type CalendarReminder = CalendarLink & CalendarRecipients & { id: string; date: string; time: string | null; note: string };
export type CalendarZoomMeeting = CalendarLink & CalendarRecipients & {
  id: string;
  date: string;
  time: string;
  title: string;
  duration: number;
  joinUrl: string;
  readOnly?: boolean;
  clientInvitationStatus?: CalendarInvitationDelivery | null;
  clientInvitationFailure?: string | null;
};

export type CalendarActivity = CalendarReminder | CalendarZoomMeeting;
