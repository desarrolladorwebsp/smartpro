"use client";

import { Bell, CalendarDays, ChevronLeft, ChevronRight, CircleCheck, CircleX, Clock, Pencil, Trash2, Video } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useTransition, type FormEvent } from "react";
import { deleteCalendarActivity } from "@/app/dashboard/calendario/actions";
import { calendarTimeSlots, formatCalendarTime } from "@/lib/calendar-slots";
import { CalendarSlotDialog } from "./CalendarSlotDialog";
import { activityNoticeMessage, CalendarNotificationFields } from "./CalendarNotificationFields";
import { DashboardFormFooter, DashboardFormModal } from "./dashboard-form";
import type { CalendarActivity, CalendarClient, CalendarParticipant, CalendarReminder, CalendarZoomMeeting } from "./calendar-types";

const views = ["Día", "Semana", "Mes"] as const;
type CalendarView = (typeof views)[number];
const meetingScopes = [{ value: "mine", label: "Mis reuniones" }, { value: "all", label: "Todas las reuniones" }] as const;
type MeetingScope = (typeof meetingScopes)[number]["value"];

const fullDate = new Intl.DateTimeFormat("es-CL", { dateStyle: "full", timeZone: "UTC" });
const shortDate = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", timeZone: "UTC" });
const monthLabel = new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric", timeZone: "UTC" });
const weekday = new Intl.DateTimeFormat("es-CL", { weekday: "short", timeZone: "UTC" });
const weekdays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function groupByDate<T extends CalendarActivity>(activities: T[]) {
  const grouped = new Map<string, T[]>();
  for (const activity of activities) {
    const day = grouped.get(activity.date);
    if (day) day.push(activity);
    else grouped.set(activity.date, [activity]);
  }
  return grouped;
}

function activityPeople(clients: CalendarClient[], activity: CalendarActivity) {
  const client = clients.find(({ id }) => id === activity.clientKey);
  const contact = client?.contacts.find(({ id }) => id === activity.contactId);
  return [client?.name, contact?.name].filter(Boolean);
}

const invitationStatuses = {
  PENDING: { Icon: Clock, label: "Pendiente de entrega", color: "bg-amber-50 text-amber-800", description: "Esperando confirmación de Resend." },
  DELIVERED: { Icon: CircleCheck, label: "Entregada", color: "bg-emerald-50 text-emerald-800", description: "El servidor de correo del cliente aceptó la invitación." },
  FAILED: { Icon: CircleX, label: "Falló la entrega", color: "bg-red-50 text-red-800", description: "La invitación al cliente no se pudo entregar." },
};

function InvitationDelivery({ meeting }: { meeting: CalendarZoomMeeting }) {
  if (!meeting.clientInvitationStatus) return null;
  const { Icon, label, color, description } = invitationStatuses[meeting.clientInvitationStatus];
  const detail = meeting.clientInvitationFailure || description;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold ${color}`}
      role="status" title={detail} aria-label={`Invitación al cliente: ${label}. ${detail}`}>
      <Icon size={14} aria-hidden="true" className="shrink-0" />{label}
    </span>
  );
}

function ActivityRow({ activity, clients, onEdit, onDelete }: {
  activity: CalendarActivity;
  clients: CalendarClient[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isMeeting = "joinUrl" in activity;
  const canManage = !isMeeting || !activity.readOnly;
  const Icon = isMeeting ? Video : Bell;
  const deleteLabel = isMeeting ? "Eliminar reunión de Zoom" : "Eliminar recordatorio";
  const editLabel = isMeeting ? "Editar reunión de Zoom" : "Editar recordatorio";
  const details = [
    isMeeting ? "Reunión por Zoom" : "Recordatorio",
    isMeeting && `${activity.duration} min`,
    ...activityPeople(clients, activity),
  ].filter(Boolean).join(" · ");
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border bg-white px-3 py-2.5 text-sm">
      <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${isMeeting ? "bg-primary/10 text-primary" : "bg-amber-50 text-amber-700"}`}>
        <Icon size={16} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium tabular-nums text-muted">{activity.time ?? "Sin hora"}</p>
        <p className="whitespace-pre-wrap break-words font-semibold">{isMeeting ? activity.title : activity.note}</p>
        <p className="mt-0.5 break-words text-xs text-muted">{details}</p>
      </div>
      <div className={`flex flex-wrap items-center justify-end gap-x-2 gap-y-1 ${isMeeting && activity.clientInvitationStatus ? "w-full sm:w-auto" : ""}`}>
        {isMeeting && (
          <>
            <InvitationDelivery meeting={activity} />
            <a href={activity.joinUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex min-h-8 shrink-0 items-center rounded-md px-1 font-semibold text-primary hover:underline">Abrir Zoom</a>
          </>
        )}
        {canManage && (
          <>
            <button type="button" onClick={onEdit} aria-label={editLabel} title={editLabel}
              className="grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-primary/10 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">
              <Pencil size={16} aria-hidden="true" />
            </button>
            <button type="button" onClick={onDelete} aria-label={deleteLabel} title={deleteLabel}
              className="grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-red-700">
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </li>
  );
}

function DeleteActivityDialog({ activity, participants, clientEmail, onClose, onDeleted }: {
  activity: CalendarActivity;
  participants: CalendarParticipant[];
  clientEmail: string;
  onClose: () => void;
  onDeleted: (activity: CalendarActivity, message: string) => void;
}) {
  const isMeeting = "joinUrl" in activity;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function confirmDeletion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    setError("");
    startTransition(async () => {
      try {
        const result = await deleteCalendarActivity(activity.id, isMeeting ? "zoom" : "reminder", form);
        if (result.error) {
          setError(result.error);
          return;
        }
        onDeleted(activity, activityNoticeMessage(result.notices));
      } catch {
        setError("No se pudo eliminar la actividad. Vuelve a intentarlo.");
      }
    });
  }

  return (
    <DashboardFormModal eyebrow="Calendario" title={isMeeting ? "Eliminar reunión de Zoom" : "Eliminar recordatorio"}
      onClose={pending ? () => {} : onClose}>
      <form onSubmit={confirmDeletion} className="flex min-h-0 flex-col">
      <div className="space-y-4 overflow-y-auto px-4 py-3 text-sm">
        <p className="whitespace-pre-wrap break-words font-semibold">{isMeeting ? activity.title : activity.note}</p>
        <p className="text-muted">{isMeeting ? "La reunión se eliminará del calendario y de Zoom." : "El recordatorio se eliminará del calendario."}</p>
        <CalendarNotificationFields participants={participants} initialIds={activity.notificationTargets?.participantIds}
          clientEmail={clientEmail} recipientKey={activity.id} zoom={isMeeting} deleting pending={pending} />
      </div>
      <DashboardFormFooter error={error}>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={pending} autoFocus
            className="h-9 rounded-full border border-border px-4 text-sm font-medium disabled:opacity-60">Cancelar</button>
          <button type="submit" disabled={pending}
            className="h-9 rounded-full bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60">
            {pending ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </DashboardFormFooter>
      </form>
    </DashboardFormModal>
  );
}

function CalendarTimeButton({ time, activities, clients, onClick }: {
  time: string;
  activities: CalendarActivity[];
  clients: CalendarClient[];
  onClick: () => void;
}) {
  const tooltipId = useId();
  const hasActivities = activities.length > 0;
  return (
    <li className="group relative min-w-0">
      <button type="button" onClick={onClick} aria-describedby={hasActivities ? tooltipId : undefined}
        className="relative h-11 w-full rounded-lg border border-border bg-slate-50 px-2 text-sm font-medium tabular-nums hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-primary">
        {formatCalendarTime(time)}
        {hasActivities && (
          <span aria-hidden="true" className="absolute inset-x-2 bottom-1 flex justify-center gap-0.5 overflow-hidden">
            {activities.map((activity) => {
              const isMeeting = "joinUrl" in activity;
              return <span key={`${isMeeting ? "meeting" : "reminder"}:${activity.id}`}
                className={`size-1.5 shrink-0 rounded-full ${isMeeting ? "bg-primary" : "bg-amber-500"}`} />;
            })}
          </span>
        )}
      </button>
      {hasActivities && (
        <div id={tooltipId} role="tooltip"
          className="absolute inset-x-0 top-full z-20 hidden max-h-44 space-y-2 overflow-y-auto rounded-lg bg-navy p-2.5 text-xs text-white shadow-lg group-focus-within:block group-hover:block">
          {activities.map((activity) => {
            const isMeeting = "joinUrl" in activity;
            return <div key={`${isMeeting ? "meeting" : "reminder"}:${activity.id}`} className="break-words">
              <p className="font-semibold">{isMeeting ? "Reunión por Zoom" : "Recordatorio"}</p>
              <p className="whitespace-pre-wrap">{isMeeting ? activity.title : activity.note}</p>
              <p className="text-white/75">{[isMeeting && `${activity.duration} min`, ...activityPeople(clients, activity)].filter(Boolean).join(" · ")}</p>
            </div>;
          })}
        </div>
      )}
    </li>
  );
}

const control = "inline-flex min-h-10 items-center justify-center rounded-xl border border-border bg-white px-3 text-sm font-medium text-foreground transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-primary";

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function firstOfMonth(date: Date) {
  const result = new Date(date);
  result.setUTCDate(1);
  return result;
}

function moveMonth(date: Date, months: number) {
  const result = firstOfMonth(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  const nextMonth = new Date(result);
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
  result.setUTCDate(Math.min(date.getUTCDate(), addDays(nextMonth, -1).getUTCDate()));
  return result;
}

function monday(date: Date) {
  return addDays(date, -((date.getUTCDay() + 6) % 7));
}

export function DashboardCalendar({ initialClientKey, initialToday, initialReminders, initialMeetings, zoomConfigured, clients: initialClients, participants, meetingScope }: {
  initialClientKey: string;
  initialToday: string;
  initialReminders: CalendarReminder[];
  initialMeetings: CalendarZoomMeeting[];
  zoomConfigured: boolean;
  clients: CalendarClient[];
  participants: CalendarParticipant[];
  meetingScope?: MeetingScope;
}) {
  const [clients, setClients] = useState(initialClients);
  const router = useRouter();
  const [meetingChanges, setMeetingChanges] = useState<{ source: CalendarZoomMeeting[]; meetings: CalendarZoomMeeting[] }>(
    { source: initialMeetings, meetings: initialMeetings },
  );
  const [deletedMeetingIds, setDeletedMeetingIds] = useState<Set<string>>(() => new Set());
  const [activityToDelete, setActivityToDelete] = useState<CalendarActivity | null>(null);
  const [activityToEdit, setActivityToEdit] = useState<CalendarActivity | null>(null);
  const [feedback, setFeedback] = useState("");
  const meetings = (meetingChanges.source === initialMeetings ? meetingChanges.meetings : initialMeetings)
    .filter(({ id }) => !deletedMeetingIds.has(id));
  const hasPendingInvitations = meetings.some(({ clientInvitationStatus }) => clientInvitationStatus === "PENDING");

  useEffect(() => {
    if (!hasPendingInvitations) return;
    function refreshVisibleCalendar() {
      if (document.visibilityState === "visible") router.refresh();
    }
    const interval = window.setInterval(refreshVisibleCalendar, 30_000);
    window.addEventListener("focus", refreshVisibleCalendar);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshVisibleCalendar);
    };
  }, [hasPendingInvitations, router]);
  const [reminders, setReminders] = useState(initialReminders);
  const [slot, setSlot] = useState<string | null>(null);
  const [view, setView] = useState<CalendarView>(initialClientKey ? "Día" : "Semana");
  const [selected, setSelected] = useState(() => new Date(`${initialToday}T00:00:00Z`));
  const selectedDate = selected.toISOString().slice(0, 10);
  const remindersByDate = groupByDate(reminders);
  const meetingsByDate = groupByDate(meetings);
  function activitiesFor(date: string): CalendarActivity[] {
    return [...(meetingsByDate.get(date) ?? []), ...(remindersByDate.get(date) ?? [])]
      .sort((a, b) => (a.time ?? "24:00").localeCompare(b.time ?? "24:00"));
  }
  const dayActivities = view === "Día" ? activitiesFor(selectedDate) : [];
  const weekStart = monday(selected);
  const agendaDays = (view === "Semana" ? Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)) : [selected])
    .map((date) => {
      const key = date.toISOString().slice(0, 10);
      return { date, key, activities: view === "Día" ? dayActivities : activitiesFor(key) };
    }).filter(({ activities }) => activities.length > 0);
  const agendaTitle = view === "Día" ? "Actividades del día" : "Actividades de la semana";
  const monthStart = monday(firstOfMonth(selected));
  const monthEnd = addDays(firstOfMonth(moveMonth(selected, 1)), -1);
  const monthCells = Math.ceil((monthEnd.getTime() - monthStart.getTime() + 86_400_000) / (7 * 86_400_000)) * 7;
  const period = (view === "Mes" ? monthLabel.format(selected) : view === "Día"
    ? fullDate.format(selected) : shortDate.formatRange(weekStart, addDays(weekStart, 6))).replace(/\s/g, " ");

  function removeDeletedActivity(activity: CalendarActivity, message: string) {
    if ("joinUrl" in activity) {
      setDeletedMeetingIds((current) => new Set(current).add(activity.id));
    } else {
      setReminders((current) => current.filter(({ id }) => id !== activity.id));
    }
    setActivityToDelete(null);
    setFeedback(["Actividad eliminada.", message].filter(Boolean).join(" "));
    router.refresh();
  }

  function savedMeeting(meeting: CalendarZoomMeeting, message?: string) {
    setMeetingChanges((current) => {
      const previous = current.source === initialMeetings ? current.meetings : initialMeetings;
      return { source: initialMeetings, meetings: [...previous.filter(({ id }) => id !== meeting.id), meeting] };
    });
    setSelected(new Date(`${meeting.date}T00:00:00Z`));
    if (activityToEdit) setFeedback(["Reunión actualizada.", message].filter(Boolean).join(" "));
    router.refresh();
  }

  function savedReminder(reminder: CalendarReminder, message?: string) {
    setReminders((current) => [...current.filter(({ id }) => id !== reminder.id), reminder]);
    setSelected(new Date(`${reminder.date}T00:00:00Z`));
    setFeedback([activityToEdit ? "Recordatorio actualizado." : "Recordatorio guardado.", message].filter(Boolean).join(" "));
    closeEditor();
    router.refresh();
  }

  function closeEditor() {
    setActivityToEdit(null);
    setSlot(null);
  }

  const deleteContact = activityToDelete && clients.find(({ id }) => id === activityToDelete.clientKey)
    ?.contacts.find(({ id }) => id === (activityToDelete.contactId ?? activityToDelete.clientKey?.split(":")[1]));

  function navigate(direction: number) {
    setSelected((current) => view === "Mes" ? moveMonth(current, direction)
      : addDays(current, direction * (view === "Semana" ? 7 : 1)));
  }

  function openDay(date: Date) {
    setSelected(date);
    setView("Día");
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-5">
      <header className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <CalendarDays size={22} aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Calendario</h1>
      </header>
      {feedback && <p role="status" className="rounded-xl bg-slate-50 px-4 py-2 text-sm">{feedback}</p>}

      {initialClientKey && (
        <p className="rounded-xl bg-primary/10 px-4 py-3 text-sm text-foreground">
          Elige un horario para agendar con <strong>{clients.find(({ id }) => id === initialClientKey)?.name}</strong>.
        </p>
      )}
      <section aria-label="Calendario" className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3 sm:gap-3 sm:p-4">
          <div className="flex items-center gap-2">
            <button type="button" className={control} onClick={() => navigate(-1)} aria-label="Periodo anterior"><ChevronLeft size={17} /></button>
            <button type="button" className={control} onClick={() => navigate(1)} aria-label="Periodo siguiente"><ChevronRight size={17} /></button>
            <button type="button" className={control} onClick={() => setSelected(new Date(`${initialToday}T00:00:00Z`))}>Hoy</button>
          </div>
          {meetingScope && (
            <nav aria-label="Filtro de reuniones" className="order-last flex flex-wrap rounded-xl border border-border bg-slate-50 p-1 sm:order-none sm:ml-auto">
              {meetingScopes.map(({ value, label }) => (
                <Link key={value} href={{ pathname: "/dashboard/calendario", query: {
                  cliente: initialClientKey || undefined,
                  reuniones: value === "all" ? "todas" : undefined,
                } }} scroll={false} prefetch={false} aria-current={meetingScope === value ? "true" : undefined}
                  className={`inline-flex min-h-9 items-center rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary ${meetingScope === value ? "bg-primary/10 text-primary" : "text-muted hover:text-foreground"}`}>
                  {label}
                </Link>
              ))}
            </nav>
          )}
          <div role="group" aria-label="Vista del calendario" className="flex rounded-xl border border-border bg-slate-50 p-1">
            {views.map((option) => (
              <button key={option} type="button" aria-pressed={view === option} onClick={() => setView(option)}
                className={`min-h-9 rounded-lg px-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary sm:px-3 ${view === option ? "bg-primary/10 text-primary" : "text-muted hover:text-foreground"}`}>
                {option}
              </button>
            ))}
          </div>
        </div>

        <h2 aria-live="polite" className="px-4 py-3 text-base font-semibold capitalize sm:px-5 sm:text-lg">{period}</h2>

        {view === "Día" ? (
          <ul aria-label="Horarios del día" className="grid grid-cols-2 gap-2 border-t border-border p-3 sm:grid-cols-4 sm:p-5">
            {calendarTimeSlots.map((time) => (
              <CalendarTimeButton key={time} time={time} activities={dayActivities.filter((activity) => activity.time === time)}
                clients={clients} onClick={() => setSlot(time)} />
            ))}
          </ul>
        ) : (
          <div className="border-t border-border">
            {view === "Mes" && (
              <div className="grid grid-cols-7 border-b border-border bg-slate-50" aria-hidden="true">
                {weekdays.map((day) => <span key={day} className="py-2 text-center text-xs font-medium text-muted">{day}</span>)}
              </div>
            )}
            <div className="grid grid-cols-7 gap-px bg-border">
              {Array.from({ length: view === "Semana" ? 7 : monthCells }, (_, index) => {
                const date = addDays(view === "Semana" ? weekStart : monthStart, index);
                const key = date.toISOString().slice(0, 10);
                const isToday = key === initialToday;
                const meetingCount = meetingsByDate.get(key)?.length ?? 0;
                const reminderCount = remindersByDate.get(key)?.length ?? 0;
                const reminderLabel = reminderCount === 1 ? "1 recordatorio" : `${reminderCount} recordatorios`;
                const outsideMonth = view === "Mes" && date.getUTCMonth() !== selected.getUTCMonth();
                return (
                  <button key={key} type="button" aria-label={[fullDate.format(date), reminderCount > 0 ? reminderLabel : "", meetingCount ? (meetingCount === 1 ? "1 reunión" : `${meetingCount} reuniones`) : ""].filter(Boolean).join(", ")} aria-current={isToday ? "date" : undefined}
                    onClick={() => openDay(date)}
                    className={`min-w-0 p-1 text-center transition-colors hover:bg-primary/10 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-primary ${view === "Semana" ? "min-h-20 sm:min-h-24" : "min-h-14 sm:min-h-20"} ${outsideMonth ? "bg-slate-50 text-muted" : "bg-white text-foreground"}`}>
                    <span className="flex h-full flex-col items-center justify-start gap-1 pt-1">
                      {view === "Semana" && <span className="text-xs capitalize text-muted">{weekday.format(date)}</span>}
                      <span className={`grid size-7 place-items-center rounded-full text-sm tabular-nums ${isToday ? "bg-primary font-semibold text-white" : ""}`}>{date.getUTCDate()}</span>
                      {reminderCount + meetingCount > 0 && <span className="flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary" aria-hidden="true">
                        <span className="size-1.5 rounded-full bg-primary" />{reminderCount + meetingCount}
                      </span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {view !== "Mes" && (
          <section aria-label={agendaTitle} className="border-t border-border bg-slate-50/70 px-3 py-4 sm:px-5">
            <h3 className="text-base font-semibold">{agendaTitle}</h3>
            {agendaDays.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No hay reuniones ni recordatorios {view === "Día" ? "este día" : "esta semana"}.</p>
            ) : (
              <div className="mt-3 space-y-4">
                {agendaDays.map(({ date, key, activities }) => (
                  <div key={key}>
                    {view === "Semana" && <h4 className="mb-2 text-sm font-semibold capitalize">{fullDate.format(date)}</h4>}
                    <ul aria-label={fullDate.format(date)} className="space-y-2">
                      {activities.map((activity) => (
                        <ActivityRow key={`${"joinUrl" in activity ? "meeting" : "reminder"}:${activity.id}`}
                          activity={activity} clients={clients} onEdit={() => setActivityToEdit(activity)} onDelete={() => setActivityToDelete(activity)} />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </section>
      {activityToDelete && <DeleteActivityDialog activity={activityToDelete} participants={participants}
        clientEmail={activityToDelete.notificationTargets?.clientEmail || deleteContact?.email || ""}
        onClose={() => setActivityToDelete(null)} onDeleted={removeDeletedActivity} />}
      {(slot || activityToEdit) && <CalendarSlotDialog key={activityToEdit?.id ?? slot} date={activityToEdit?.date ?? selectedDate}
        startTime={slot ?? undefined} today={initialToday} editing={activityToEdit ?? undefined}
        zoomConfigured={zoomConfigured} clients={clients} participants={participants} initialClientKey={initialClientKey}
        onClose={closeEditor}
        onContactAdded={(clientKey, contact) => setClients((current) => current.map((client) =>
          client.id === clientKey ? { ...client, contacts: [...client.contacts, contact] } : client))}
        onMeetingSaved={savedMeeting} onSaved={savedReminder} />}
    </div>
  );
}
