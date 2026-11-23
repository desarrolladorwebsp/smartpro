export type CalendarNotificationTargets = {
  clientEmail: string;
  participantIds: string[];
};

export function readCalendarNotificationTargets(value: unknown, legacyEmail?: string | null): CalendarNotificationTargets {
  const stored = value && typeof value === "object" ? value as Partial<CalendarNotificationTargets> : {};
  return {
    clientEmail: typeof stored.clientEmail === "string" ? stored.clientEmail : (legacyEmail ?? ""),
    participantIds: Array.isArray(stored.participantIds) ? stored.participantIds.filter((id) => typeof id === "string") : [],
  };
}
