const PREFIX = "VEN";

export function nextSaleNumber(latest: string | null | undefined, now = new Date()): string {
  const year = now.getFullYear();
  const yearPrefix = `${PREFIX}-${year}-`;

  if (!latest || !latest.startsWith(yearPrefix)) {
    return `${yearPrefix}0001`;
  }

  const sequence = Number.parseInt(latest.slice(yearPrefix.length), 10);

  if (!Number.isFinite(sequence) || sequence < 1) {
    return `${yearPrefix}0001`;
  }

  return `${yearPrefix}${String(sequence + 1).padStart(4, "0")}`;
}
