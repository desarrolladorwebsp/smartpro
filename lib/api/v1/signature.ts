import crypto from "node:crypto";

export const SIGNATURE_VERSION = "v1";
export const SIGNATURE_HEADER = "x-smartpro-signature";
export const TIMESTAMP_HEADER = "x-smartpro-timestamp";
export const PUBLIC_KEY_HEADER = "x-smartpro-key";
export const IDEMPOTENCY_HEADER = "idempotency-key";

/// Ventana de tolerancia del reloj. Una petición firmada fuera de este rango
/// se rechaza para que una captura de tráfico no pueda reproducirse más tarde.
export const SIGNATURE_TOLERANCE_SECONDS = 300;

export function sha256Hex(body: string): string {
  return crypto.createHash("sha256").update(body, "utf8").digest("hex");
}

export function canonicalRequestPath(url: string): string {
  const parsed = new URL(url);
  return `${parsed.pathname}${parsed.search}`;
}

export function buildSignaturePayload(input: {
  timestamp: number | string;
  method: string;
  path: string;
  body: string;
}): string {
  return [
    SIGNATURE_VERSION,
    String(input.timestamp),
    input.method.toUpperCase(),
    input.path,
    sha256Hex(input.body ?? ""),
  ].join("\n");
}

export function signRequest(input: {
  secret: string;
  timestamp: number | string;
  method: string;
  path: string;
  body: string;
}): string {
  const digest = crypto
    .createHmac("sha256", input.secret)
    .update(buildSignaturePayload(input), "utf8")
    .digest("hex");

  return `${SIGNATURE_VERSION}=${digest}`;
}

export function parseSignatureHeader(header: string | null | undefined): string | null {
  if (!header) {
    return null;
  }

  for (const part of header.split(",")) {
    const [version, digest] = part.split("=");
    if (version?.trim() === SIGNATURE_VERSION && digest?.trim()) {
      return digest.trim();
    }
  }

  return null;
}

export function parseTimestampHeader(header: string | null | undefined): number | null {
  const raw = String(header ?? "").trim();

  if (!raw || !/^\d{1,13}$/.test(raw)) {
    return null;
  }

  const numeric = Number(raw);
  // Aceptamos segundos o milisegundos: los sitios satélite suelen usar Date.now().
  const seconds = raw.length > 10 ? Math.floor(numeric / 1000) : numeric;

  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

export function isTimestampFresh(
  timestampSeconds: number,
  nowMs = Date.now(),
  toleranceSeconds = SIGNATURE_TOLERANCE_SECONDS,
): boolean {
  const skew = Math.abs(Math.floor(nowMs / 1000) - timestampSeconds);
  return skew <= toleranceSeconds;
}

export function safeCompareHex(expected: string, received: string): boolean {
  if (!expected || !received || expected.length !== received.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(received, "hex"));
  } catch {
    return false;
  }
}

export type SignatureVerification =
  | { ok: true }
  | { ok: false; reason: "missing_signature" | "missing_timestamp" | "expired" | "mismatch" };

export function verifyRequestSignature(input: {
  secret: string;
  method: string;
  path: string;
  body: string;
  signatureHeader: string | null | undefined;
  timestampHeader: string | null | undefined;
  nowMs?: number;
  toleranceSeconds?: number;
}): SignatureVerification {
  const received = parseSignatureHeader(input.signatureHeader);

  if (!received) {
    return { ok: false, reason: "missing_signature" };
  }

  const timestamp = parseTimestampHeader(input.timestampHeader);

  if (timestamp === null) {
    return { ok: false, reason: "missing_timestamp" };
  }

  if (!isTimestampFresh(timestamp, input.nowMs ?? Date.now(), input.toleranceSeconds)) {
    return { ok: false, reason: "expired" };
  }

  const expected = signRequest({
    secret: input.secret,
    timestamp,
    method: input.method,
    path: input.path,
    body: input.body,
  });

  return safeCompareHex(parseSignatureHeader(expected) ?? "", received) ? { ok: true } : { ok: false, reason: "mismatch" };
}

export function signWebhookPayload(input: { secret: string; timestamp: number; body: string }): string {
  const digest = crypto
    .createHmac("sha256", input.secret)
    .update([SIGNATURE_VERSION, String(input.timestamp), sha256Hex(input.body)].join("\n"), "utf8")
    .digest("hex");

  return `${SIGNATURE_VERSION}=${digest}`;
}
