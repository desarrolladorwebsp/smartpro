export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function toPlainTextLines(values: Array<string | undefined | null>): string {
  return values
    .flatMap((value) => (value == null ? [] : [value]))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
