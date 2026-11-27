const format = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeZone: "America/Santiago" });

export function ClientCreationDate({ createdAt }: { createdAt?: string | Date | null }) {
  if (!createdAt) return "Sin fecha registrada";
  const date = new Date(createdAt);
  return <time dateTime={date.toISOString()}>{format.format(date)}</time>;
}
