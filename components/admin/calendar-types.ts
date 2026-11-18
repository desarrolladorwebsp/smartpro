export type CalendarClient = {
  id: string;
  name: string;
  contacts: { id: string; name: string }[];
};

export type CalendarLink = { clientKey: string | null; contactId: string | null };
export type CalendarReminder = CalendarLink & { id: string; date: string; time: string | null; note: string };
export type CalendarZoomMeeting = CalendarLink & { id: string; date: string; time: string; title: string; duration: number; joinUrl: string };
