export const CRM_ARCHIVE_STATES = [
  { id: "LOST", label: "Perdido" },
  { id: "PAUSED", label: "En pausa" },
  { id: "ARCHIVED", label: "Archivados" },
] as const;

export type CrmArchiveState = (typeof CRM_ARCHIVE_STATES)[number]["id"];
export type ManualCrmArchiveState = Extract<CrmArchiveState, "ARCHIVED">;

export function isCrmArchiveState(value: unknown): value is CrmArchiveState {
  return CRM_ARCHIVE_STATES.some(({ id }) => id === value);
}


export function crmArchiveLabel(state?: CrmArchiveState | null) {
  return CRM_ARCHIVE_STATES.find(({ id }) => id === state)?.label;
}

export function crmToday(now = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Santiago", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function parseReactivationDate(value: unknown, today = crmToday()): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value <= today) return null;
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}
