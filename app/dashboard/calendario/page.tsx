import { Suspense } from "react";
import type { Prisma } from "@prisma/client";
import { DashboardCalendar } from "@/components/admin/DashboardCalendar";
import { listBusinesses } from "@/lib/clients/business-repository";
import { listClients } from "@/lib/clients/repository";
import { listCommercialClients, personName } from "@/lib/clients/commercial-clients";
import { zoomCalendarConfig } from "@/lib/zoom-calendar";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { calendarToday } from "@/lib/calendar-slots";
import { listAssignableExecutives } from "@/lib/executives/repository";
import { readCalendarNotificationTargets } from "@/lib/calendar-notification-targets";

type CalendarPageProps = { searchParams: Promise<{ cliente?: string | string[]; reuniones?: string | string[] }> };

async function CalendarContent({ searchParams }: CalendarPageProps) {
  const session = await requireAdminSession();
  const db = prisma;
  if (!db) throw new Error("Base de datos no disponible.");
  const { cliente, reuniones } = await searchParams;
  const ownerEmail = session.email.toLowerCase();
  const meetingScope = session.role === "ADMIN" ? (reuniones === "todas" ? "all" : "mine") : undefined;
  const executivesRequest = listAssignableExecutives();
  const zoomMeetingsRequest = async () => {
    const participantId = meetingScope === "mine"
      ? (await executivesRequest).find(({ email }) => email.toLowerCase() === ownerEmail)?.id
      : undefined;
    const where: Prisma.CalendarZoomMeetingWhereInput = { joinUrl: { not: null } };
    if (participantId) {
      where.OR = [{ ownerEmail }, { notificationTargets: { path: "$.participantIds", array_contains: [participantId] } }];
    } else if (meetingScope !== "all") {
      where.ownerEmail = ownerEmail;
    }
    return db.calendarZoomMeeting.findMany({
      where,
      orderBy: [{ date: "asc" }, { time: "asc" }],
      select: {
        id: true, ownerEmail: true, date: true, time: true, title: true, duration: true, joinUrl: true, clientKey: true, contactId: true,
        clientInvitationStatus: true, clientInvitationFailure: true, clientInvitationEmail: true, notificationTargets: true,
      },
    });
  };
  const [records, businesses, reminders, zoomMeetings, executives] = await Promise.all([
    listClients(),
    listBusinesses(),
    db.calendarReminder.findMany({
      where: { ownerEmail },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      select: { id: true, date: true, time: true, note: true, clientKey: true, contactId: true, notificationTargets: true },
    }),
    zoomMeetingsRequest(),
    executivesRequest,
  ]);
  const participants = executives.map(({ id, firstName, lastName }) => ({
    id, name: [firstName, lastName].filter(Boolean).join(" "),
  }));
  const clients = listCommercialClients(records, businesses).map(({ id, name, contacts }) => ({
    id, name, contacts: contacts.map((contact) => ({ id: contact.id, name: personName(contact) || "Contacto sin nombre", email: contact.email })),
  }));
  const initialClientKey = clients.find((client) => client.id === cliente)?.id ?? "";
  return <DashboardCalendar key={initialClientKey} initialClientKey={initialClientKey} initialToday={calendarToday()} zoomConfigured={Boolean(zoomCalendarConfig())} clients={clients} participants={participants}
    meetingScope={meetingScope}
    initialMeetings={zoomMeetings.flatMap(({ ownerEmail: organizer, clientInvitationEmail, notificationTargets, clientInvitationFailure, ...meeting }) => {
      if (!meeting.joinUrl) return [];
      const isOwner = organizer.toLowerCase() === ownerEmail;
      return [{ ...meeting, joinUrl: meeting.joinUrl, date: meeting.date.toISOString().slice(0, 10), readOnly: !isOwner,
        clientInvitationFailure: isOwner ? clientInvitationFailure : undefined,
        notificationTargets: isOwner ? readCalendarNotificationTargets(notificationTargets, clientInvitationEmail) : undefined }];
    })}
    initialReminders={reminders.map((reminder) => ({ ...reminder, date: reminder.date.toISOString().slice(0, 10),
      notificationTargets: readCalendarNotificationTargets(reminder.notificationTargets) }))} />;
}

export default function CalendarPage({ searchParams }: CalendarPageProps) {
  return (
    <Suspense fallback={<p role="status" className="text-sm text-muted">Cargando calendario…</p>}>
      <CalendarContent searchParams={searchParams} />
    </Suspense>
  );
}
