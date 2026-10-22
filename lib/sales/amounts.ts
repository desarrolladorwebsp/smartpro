/** Parses whole Chilean pesos, including pasted amounts such as "$ 1.234.567". */
export function parseSaleClpInput(value: unknown): number {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value >= 0 ? value : NaN;
  }
  if (typeof value !== "string") return NaN;

  const raw = value.trim().replace(/^\$\s*/, "");
  if (!raw) return value.trim() === "" ? 0 : NaN;
  // Thousands separators must have groups of three. Only zero cents are allowed.
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,0{1,2})?$/.test(raw)) return NaN;
  const amount = Number(raw.replace(/\./g, "").replace(/,0{1,2}$/, ""));
  return Number.isSafeInteger(amount) && amount >= 0 ? amount : NaN;
}
