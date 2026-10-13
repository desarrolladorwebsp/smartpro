import { isQuoteStatus, type QuoteStatus } from "./types";

const TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  DRAFT: ["CREATED", "SENT"],
  CREATED: ["DRAFT", "SENT", "ACCEPTED", "REJECTED"],
  SENT: ["ACCEPTED", "REJECTED"],
  ACCEPTED: [],
  REJECTED: [],
};

export function canTransitionQuoteStatus(from: QuoteStatus, to: QuoteStatus): boolean {
  if (from === to) {
    return true;
  }

  return TRANSITIONS[from].includes(to);
}

export function canSendQuote(status: QuoteStatus): boolean {
  return status === "SENT" || TRANSITIONS[status].includes("SENT");
}

export function canEditQuote(status: QuoteStatus): boolean {
  return status === "DRAFT" || status === "CREATED" || status === "SENT";
}

export function canSetQuoteStatusManually(status: QuoteStatus): boolean {
  return status !== "SENT";
}

export function nextQuoteStatusAfterEdit(existing: QuoteStatus, requested?: QuoteStatus): QuoteStatus {
  if (!canEditQuote(existing)) {
    throw new Error("Esta cotización ya no se puede modificar.");
  }

  if (existing === "DRAFT") {
    return requested === "CREATED" ? "CREATED" : "DRAFT";
  }

  return "CREATED";
}

export function canPayQuote(status: QuoteStatus): boolean {
  return status === "CREATED" || status === "SENT" || status === "ACCEPTED";
}

export function isQuoteExpired(validUntil: string | null, now = new Date()): boolean {
  if (!validUntil) return false;
  const date = new Date(validUntil);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < now.getTime();
}

export function assertQuoteStatusTransition(from: QuoteStatus, to: QuoteStatus) {
  if (!canTransitionQuoteStatus(from, to)) {
    throw new Error("Ese cambio de estado no está permitido.");
  }
}

export function parseQuoteStatus(value: unknown): QuoteStatus {
  if (!isQuoteStatus(value)) {
    throw new Error("Estado de cotización inválido.");
  }

  return value;
}
