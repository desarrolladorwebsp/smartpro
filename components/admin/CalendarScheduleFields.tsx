"use client";

import { useEffect, useState } from "react";
import { calendarTimeSlots, formatCalendarTime, parseCalendarDate } from "@/lib/calendar-slots";

export function CalendarScheduleFields({ initialDate, minDate }: { initialDate: string; minDate?: string }) {
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState("");
  const [availability, setAvailability] = useState<{ date: string; occupied: string[] | null } | null>(null);
  const validDate = Boolean(parseCalendarDate(date));
  const status = availability?.date === date ? availability : null;
  const occupied = new Set(status?.occupied ?? []);

  useEffect(() => {
    if (!validDate) return;
    const controller = new AbortController();

    async function loadAvailability() {
      try {
        const response = await fetch(`/api/calendar/occupied-slots?date=${encodeURIComponent(date)}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Agenda no disponible.");
        const result: { occupied: string[] } = await response.json();
        if (!controller.signal.aborted) setAvailability({ date, occupied: result.occupied });
      } catch {
        if (!controller.signal.aborted) setAvailability({ date, occupied: null });
      }
    }

    void loadAvailability();
    return () => controller.abort();
  }, [date, validDate]);

  return (
    <div className="grid items-start gap-3 sm:grid-cols-2">
      <label className="block text-sm font-medium">
        Fecha
        <input name="date" type="date" required value={date} min={minDate}
          onChange={(event) => { setDate(event.target.value); setAvailability(null); }} className="dashboard-field mt-1.5" />
      </label>
      <div>
        <label className="block text-sm font-medium">
          Hora de Chile
          <select name="time" required value={time} onChange={(event) => setTime(event.target.value)}
            data-occupied={occupied.has(time) ? "" : undefined} className="dashboard-field calendar-time-select mt-1.5">
            <option value="" disabled>Elige una hora</option>
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
