import { IDEMPOTENCY_HEADER, PUBLIC_KEY_HEADER, SIGNATURE_HEADER, TIMESTAMP_HEADER } from "./signature";

export const ALLOWED_REQUEST_HEADERS = [
  "content-type",
  "authorization",
  PUBLIC_KEY_HEADER,
  SIGNATURE_HEADER,
  TIMESTAMP_HEADER,
  IDEMPOTENCY_HEADER,
].join(", ");

export function normalizeOrigin(value: string | null | undefined): string | null {
  const raw = String(value ?? "").trim();

  if (!raw || raw === "null") {
    return null;
  }

  try {
    const url = new URL(raw);
    return `${url.protocol}//${url.host}`.toLowerCase();
  } catch {
    return null;
  }
}

/// Acepta `https://mi-sitio.cl` y también comodines de un solo nivel como
/// `https://*.mi-sitio.cl`, útil para entornos de vista previa.
export function originMatchesPattern(origin: string, pattern: string): boolean {
  const normalizedOrigin = normalizeOrigin(origin);
  const normalizedPattern = String(pattern ?? "").trim().toLowerCase().replace(/\/$/, "");

  if (!normalizedOrigin || !normalizedPattern) {
    return false;
  }

  if (normalizedPattern === "*") {
    return true;
  }

  if (!normalizedPattern.includes("*")) {
    return normalizeOrigin(normalizedPattern) === normalizedOrigin;
  }

  const [scheme, host] = normalizedPattern.split("://");

  if (!scheme || !host) {
    return false;
  }

  const originUrl = new URL(normalizedOrigin);

  if (`${originUrl.protocol}//`.replace("://", "") !== scheme.replace(":", "")) {
    return false;
  }

  const suffix = host.replace(/^\*\./, "");
  return originUrl.host === suffix || originUrl.host.endsWith(`.${suffix}`);
}

export function isOriginAllowed(origin: string | null | undefined, allowed: readonly string[]): boolean {
  const normalized = normalizeOrigin(origin);

  if (!normalized) {
    return false;
  }

  return allowed.some((pattern) => originMatchesPattern(normalized, pattern));
}

export function corsHeaders(origin: string | null, methods: readonly string[]): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": [...methods, "OPTIONS"].join(", "),
    "Access-Control-Allow-Headers": ALLOWED_REQUEST_HEADERS,
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };

  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}
