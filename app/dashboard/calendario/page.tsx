import { Suspense } from "react";
import { DashboardCalendar } from "@/components/admin/DashboardCalendar";
import { listBusinesses } from "@/lib/clients/business-repository";
import { listClients } from "@/lib/clients/repository";
import { listCommercialClients, personName } from "@/lib/clients/commercial-clients";
import { zoomCalendarConfig } from "@/lib/zoom-calendar";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { calendarToday } from "@/lib/calendar-slots";
import { listAssignableExecutives } from "@/lib/executives/repository";

type CalendarPageProps = { searchParams: Promise<{ cliente?: string | string[] }> };

async function CalendarContent({ searchParams }: CalendarPageProps) {
  const session = await requireAdminSession();
  if (!prisma) throw new Error("Base de datos no disponible.");
  const [records, businesses, reminders, zoomMeetings, executives] = await Promise.all([listClients(), listBusinesses(), prisma.calendarReminder.findMany({
    where: { ownerEmail: session.email.toLowerCase() },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    select: { id: true, date: true, time: true, note: true, clientKey: true, contactId: true },
  }), prisma.calendarZoomMeeting.findMany({
    where: { ownerEmail: session.email.toLowerCase(), joinUrl: { not: null } },
    orderBy: [{ date: "asc" }, { time: "asc" }],
    select: {
      id: true, date: true, time: true, title: true, duration: true, joinUrl: true, clientKey: true, contactId: true,
      clientInvitationStatus: true, clientInvitationFailure: true,
    },
  }), listAssignableExecutives()]);
  const participants = executives.map(({ id, firstName, lastName }) => ({
    id, name: [firstName, lastName].filter(Boolean).join(" "),
  }));
  const clients = listCommercialClients(records, businesses).map(({ id, name, contacts }) => ({
    id, name, contacts: contacts.map((contact) => ({ id: contact.id, name: personName(contact) || "Contacto sin nombre", email: contact.email })),
  }));
  const { cliente } = await searchParams;
  const initialClientKey = clients.find((client) => client.id === cliente)?.id ?? "";
  return <DashboardCalendar key={initialClientKey} initialClientKey={initialClientKey} initialToday={calendarToday()} zoomConfigured={Boolean(zoomCalendarConfig())} clients={clients} participants={participants}
    initialMeetings={zoomMeetings.flatMap((meeting) => meeting.joinUrl
      ? [{ ...meeting, joinUrl: meeting.joinUrl, date: meeting.date.toISOString().slice(0, 10) }] : [])}
    initialReminders={reminders.map((reminder) => ({ ...reminder, date: reminder.date.toISOString().slice(0, 10) }))} />;
}

export default function CalendarPage({ searchParams }: CalendarPageProps) {
  return (
    <Suspense fallback={<p role="status" className="text-sm text-muted">Cargando calendario…</p>}>
      <CalendarContent searchParams={searchParams} />
    </Suspense>
  );
}
