import type { CalendarInvitationDelivery } from "@prisma/client";

export type CalendarClient = {
  id: string;
  name: string;
  contacts: { id: string; name: string; email: string }[];
};

export type CalendarParticipant = { id: string; name: string };

export type CalendarLink = { clientKey: string | null; contactId: string | null };
export type CalendarReminder = CalendarLink & { id: string; date: string; time: string | null; note: string };
export type CalendarZoomMeeting = CalendarLink & {
  id: string;
  date: string;
  time: string;
  title: string;
  duration: number;
  joinUrl: string;
  clientInvitationStatus?: CalendarInvitationDelivery | null;
  clientInvitationFailure?: string | null;
};
