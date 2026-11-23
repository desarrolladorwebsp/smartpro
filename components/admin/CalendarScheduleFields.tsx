"use client";

import { useEffect, useState } from "react";
import { calendarTimeSlots, formatCalendarTime, parseCalendarDate } from "@/lib/calendar-slots";

export function CalendarScheduleFields({ initialDate, minDate, initialTime = "", allowUntimed = false, activityId, kind }: {
  initialDate: string;
  minDate?: string;
  initialTime?: string;
  allowUntimed?: boolean;
  activityId?: string;
  kind?: "zoom" | "reminder";
}) {
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [availability, setAvailability] = useState<{ date: string; occupied: string[] | null } | null>(null);
  const validDate = Boolean(parseCalendarDate(date));
  const status = availability?.date === date ? availability : null;
  const occupied = new Set(status?.occupied ?? []);

  useEffect(() => {
    if (!validDate) return;
    const controller = new AbortController();

    async function loadAvailability() {
      try {
        const params = new URLSearchParams({ date });
        if (activityId && kind) { params.set("activityId", activityId); params.set("kind", kind); }
        const response = await fetch(`/api/calendar/occupied-slots?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Agenda no disponible.");
        const result: { occupied: string[] } = await response.json();
        if (!controller.signal.aborted) setAvailability({ date, occupied: result.occupied });
      } catch {
        if (!controller.signal.aborted) setAvailability({ date, occupied: null });
      }
    }

    void loadAvailability();
    return () => controller.abort();
  }, [date, validDate, activityId, kind]);

  return (
    <div className="grid items-start gap-3 sm:grid-cols-2">
      <label className="block text-sm font-medium">
        Fecha
        <input name="date" type="date" required defaultValue={initialDate} min={minDate}
          onInput={(event) => { setDate(event.currentTarget.value); setAvailability(null); }} className="dashboard-field mt-1.5" />
      </label>
      <div>
        <label className="block text-sm font-medium">
          Hora de Chile
          <select name="time" required={!allowUntimed} value={time} onChange={(event) => setTime(event.target.value)}
            data-occupied={occupied.has(time) ? "" : undefined} className="dashboard-field calendar-time-select mt-1.5">
            <option value="" disabled={!allowUntimed}>{allowUntimed ? "Sin hora" : "Elige una hora"}</option>
            {calendarTimeSlots.map((slot) => (
              <option key={slot} value={slot} data-occupied={occupied.has(slot) ? "" : undefined}>
                {formatCalendarTime(slot)}{occupied.has(slot) ? " · Ocupado" : ""}
              </option>
            ))}
          </select>
        </label>
        {validDate && !status && <p role="status" className="mt-1 text-xs text-muted">Consultando agenda…</p>}
        {status && !status.occupied && <p role="status" className="mt-1 text-xs text-amber-800">No se pudo consultar la agenda.</p>}
      </div>
    </div>
  );
}
