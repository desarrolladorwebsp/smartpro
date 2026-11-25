const chileDate = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "America/Santiago",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function calendarToday(now = new Date()) {
  return chileDate.format(now);
}

export function formatCalendarTime(time: string) {
  const [hour, minute] = time.split(":");
  const hours = Number(hour);
  return `${hours % 12 || 12}:${minute} ${hours < 12 ? "a. m." : "p. m."}`;
}

export const calendarTimeSlots = Array.from({ length: 22 }, (_, index) =>
  String(9 + Math.floor(index / 2)).padStart(2, "0") + (index % 2 ? ":30" : ":00"),
);

export function parseCalendarDate(value: unknown) {
  if (typeof value !== "string" || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}
