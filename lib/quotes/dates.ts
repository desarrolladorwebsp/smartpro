export function parseQuoteValidUntil(value: string): Date {
  const dayMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());

  if (dayMatch) {
    const year = Number(dayMatch[1]);
    const month = Number(dayMatch[2]);
    const day = Number(dayMatch[3]);
    return new Date(year, month - 1, day, 23, 59, 59, 0);
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error("La fecha de vencimiento no es válida.");
  }

  return parsed;
}

export function formatQuoteDateLabel(value: string | null): string {
  if (!value) return "sin fecha de vencimiento definida";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "sin fecha de vencimiento definida";
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Santiago",
  }).format(date);
}
