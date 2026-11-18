"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useId, useState } from "react";
import { CalendarSlotDialog } from "./CalendarSlotDialog";
import type { CalendarClient, CalendarReminder, CalendarZoomMeeting } from "./calendar-types";

const views = ["Día", "Semana", "Mes"] as const;
type CalendarView = (typeof views)[number];

const fullDate = new Intl.DateTimeFormat("es-CL", { dateStyle: "full", timeZone: "UTC" });
const shortDate = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", timeZone: "UTC" });
const monthLabel = new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric", timeZone: "UTC" });
const weekday = new Intl.DateTimeFormat("es-CL", { weekday: "short", timeZone: "UTC" });
const weekdays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const timeSlots = Array.from({ length: 22 }, (_, index) => {
  const hours = 9 + Math.floor(index / 2);
  return `${hours % 12 || 12}:${index % 2 ? "30" : "00"} ${hours < 12 ? "a. m." : "p. m."}`;
});

function slotTime(index: number) {
  return String(9 + Math.floor(index / 2)).padStart(2, "0") + (index % 2 ? ":30" : ":00");
}

function ActivityPreview({ label, details }: { label: string; details: string }) {
  const tooltipId = useId();
  return (
    <span tabIndex={0} aria-describedby={tooltipId} className="group relative block rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary focus-visible:outline-primary">
      <span className="block truncate">{label}</span>
      <span id={tooltipId} role="tooltip" className="pointer-events-none absolute inset-x-0 top-full z-20 mt-1 hidden max-h-32 overflow-hidden whitespace-pre-wrap break-words rounded-lg bg-navy p-2 text-left font-normal text-white shadow-lg group-focus:block group-hover:block">
        {details}
      </span>
    </span>
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

export function DashboardCalendar({ initialClientKey, initialToday, initialReminders, initialMeetings, zoomConfigured, clients }: {
  initialClientKey: string;
  initialToday: string;
  initialReminders: CalendarReminder[];
  initialMeetings: CalendarZoomMeeting[];
  zoomConfigured: boolean;
  clients: CalendarClient[];
}) {
  const [meetings, setMeetings] = useState(initialMeetings);
  const [reminders, setReminders] = useState(initialReminders);
  const [slot, setSlot] = useState<string | null>(null);
  const [view, setView] = useState<CalendarView>(initialClientKey ? "Día" : "Semana");
  const [selected, setSelected] = useState(() => new Date(`${initialToday}T00:00:00Z`));
  const selectedDate = selected.toISOString().slice(0, 10);
  const remindersByDate = new Map<string, CalendarReminder[]>();
  for (const reminder of reminders) {
    const day = remindersByDate.get(reminder.date);
    if (day) day.push(reminder);
    else remindersByDate.set(reminder.date, [reminder]);
  }
  const dayMeetings = meetings.filter((meeting) => meeting.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));
  function activityDetails(type: string, activity: CalendarReminder | CalendarZoomMeeting, text: string, duration?: string) {
    const client = clients.find(({ id }) => id === activity.clientKey);
    const contact = client?.contacts.find(({ id }) => id === activity.contactId);
    return [[type, activity.time, duration].filter(Boolean).join(" · "), text, client?.name, contact?.name].filter(Boolean).join("\n");
  }
  const slotIndex = slot ? timeSlots.indexOf(slot) : 0;
  const startTime = slotTime(slotIndex);
  const dayReminders = remindersByDate.get(selectedDate) ?? [];
  const weekStart = monday(selected);
  const monthStart = monday(firstOfMonth(selected));
  const monthEnd = addDays(firstOfMonth(moveMonth(selected, 1)), -1);
  const monthCells = Math.ceil((monthEnd.getTime() - monthStart.getTime() + 86_400_000) / (7 * 86_400_000)) * 7;
  const period = (view === "Mes" ? monthLabel.format(selected) : view === "Día"
    ? fullDate.format(selected) : shortDate.formatRange(weekStart, addDays(weekStart, 6))).replace(/\s/g, " ");

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

      {initialClientKey && (
        <p className="rounded-xl bg-primary/10 px-4 py-3 text-sm text-foreground">
          Elige un horario para agendar con <strong>{clients.find(({ id }) => id === initialClientKey)?.name}</strong>.
        </p>
      )}
      <section aria-label="Calendario" className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <button type="button" className={control} onClick={() => navigate(-1)} aria-label="Periodo anterior"><ChevronLeft size={17} /></button>
            <button type="button" className={control} onClick={() => navigate(1)} aria-label="Periodo siguiente"><ChevronRight size={17} /></button>
            <button type="button" className={control} onClick={() => setSelected(new Date(`${initialToday}T00:00:00Z`))}>Hoy</button>
          </div>
          <div role="group" aria-label="Vista del calendario" className="flex rounded-xl border border-border bg-slate-50 p-1">
            {views.map((option) => (
              <button key={option} type="button" aria-pressed={view === option} onClick={() => setView(option)}
                className={`min-h-9 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary ${view === option ? "bg-primary/10 text-primary" : "text-muted hover:text-foreground"}`}>
                {option}
              </button>
            ))}
          </div>
        </div>

        <h2 aria-live="polite" className="px-4 py-3 text-base font-semibold capitalize sm:px-5 sm:text-lg">{period}</h2>

        {view === "Día" ? (
          <>
          <ul aria-label="Horarios del día" className="grid grid-cols-2 gap-2 border-t border-border p-3 sm:grid-cols-4 sm:p-5">
            {timeSlots.map((time, index) => {
              const hour = slotTime(index);
              return (
                <li key={time} className="min-w-0 space-y-1">
                  <button type="button" onClick={() => setSlot(time)} className="min-h-11 w-full rounded-lg border border-border bg-slate-50 px-2 text-sm font-medium tabular-nums hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-primary">{time}</button>
                  {dayMeetings.filter((meeting) => meeting.time === hour).map((meeting) => (
                    <ActivityPreview key={meeting.id} label={meeting.title}
                      details={activityDetails("Reunión por Zoom", meeting, meeting.title, meeting.duration + " min")} />
                  ))}
                  {dayReminders.filter((reminder) => reminder.time === hour).map((reminder) => (
                    <ActivityPreview key={reminder.id} label={reminder.note}
                      details={activityDetails("Recordatorio", reminder, reminder.note)} />
                  ))}
                </li>
              );
            })}
          </ul>
          {dayMeetings.length > 0 && (
            <ul aria-label="Reuniones de Zoom del día" className="space-y-2 border-t border-border p-3 sm:p-5">
              {dayMeetings.map((meeting) => {
                const client = clients.find(({ id }) => id === meeting.clientKey);
                const contact = client?.contacts.find(({ id }) => id === meeting.contactId);
                return <li key={meeting.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{meeting.time} · {meeting.title}</p>
                    <p className="text-xs text-muted">{[meeting.duration + " min", client?.name, contact?.name].filter(Boolean).join(" · ")}</p>
                  </div>
                  <a href={meeting.joinUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary">Abrir Zoom</a>
                </li>;
              })}
            </ul>
          )}
          {dayReminders.length > 0 && (
            <ul aria-label="Recordatorios del día" className="space-y-2 border-t border-border p-3 sm:p-5">
              {dayReminders.map((reminder) => {
                const client = clients.find(({ id }) => id === reminder.clientKey);
                const contact = client?.contacts.find(({ id }) => id === reminder.contactId);
                return <li key={reminder.id} className="break-words rounded-lg bg-primary/10 px-3 py-2 text-sm text-foreground">
                  <p className="text-xs font-medium text-muted">{reminder.time ?? "Sin hora"}</p>
                  <p className="mt-1 whitespace-pre-wrap">{reminder.note}</p>
                  {client && <p className="mt-1 text-xs text-muted">{[client.name, contact?.name].filter(Boolean).join(" · ")}</p>}
                </li>;
              })}
            </ul>
          )}

          </>
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
                const meetingCount = meetings.filter((meeting) => meeting.date === key).length;
                const reminderCount = remindersByDate.get(key)?.length ?? 0;
                const reminderLabel = reminderCount === 1 ? "1 recordatorio" : `${reminderCount} recordatorios`;
                const outsideMonth = view === "Mes" && date.getUTCMonth() !== selected.getUTCMonth();
                return (
                  <button key={key} type="button" aria-label={[fullDate.format(date), reminderCount > 0 ? reminderLabel : "", meetingCount ? (meetingCount === 1 ? "1 reunión" : `${meetingCount} reuniones`) : ""].filter(Boolean).join(", ")} aria-current={isToday ? "date" : undefined}
                    onClick={() => openDay(date)}
                    className={`min-w-0 p-1 text-center transition-colors hover:bg-primary/10 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-primary ${view === "Semana" ? "min-h-28 sm:min-h-44" : "min-h-14 sm:min-h-20"} ${outsideMonth ? "bg-slate-50 text-muted" : "bg-white text-foreground"}`}>
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
      </section>
      {slot && <CalendarSlotDialog date={selectedDate} time={slot} startTime={startTime} zoomConfigured={zoomConfigured} clients={clients} initialClientKey={initialClientKey}
        onClose={() => setSlot(null)}
        onMeetingSaved={(meeting) => setMeetings((current) => [...current.filter(({ id }) => id !== meeting.id), meeting])}
        onSaved={(reminder) => {
          setReminders((current) => [...current, reminder]);
          setSelected(new Date(`${reminder.date}T00:00:00Z`));
          setSlot(null);
        }} />}
    </div>
  );
}
