export const PUBLIC_PAYMENT_ERROR_TITLE = "No pudimos procesar el pago";

export const PUBLIC_PAYMENT_ERROR_MESSAGE =
  "Estamos teniendo un inconveniente para procesar tu pago. Puedes contactarnos y te ayudaremos a completar la contratación.";

export const PUBLIC_PAYMENT_STATUS_COPY = {
  redirecting: "Redirigiendo al pago…",
  processing: "Procesando…",
  confirmed: "Pago confirmado",
  failed: PUBLIC_PAYMENT_ERROR_TITLE,
} as const;

export const PAYMENT_REQUEST_TIMEOUT_MS = 25_000;

const SECRET_PATTERN =
  /((?:access[_-]?token|refresh[_-]?token|api[_-]?key|client[_-]?secret|authorization|password|private[_-]?key|secret)\s*[:=]\s*)([^\s,;]+)/gi;
const BEARER_PATTERN = /Bearer\s+[A-Za-z0-9._\-]+/gi;
const DEBUG_MESSAGE_MAX_LENGTH = 280;

export type PublicPaymentErrorKind = "validation" | "gateway" | "internal";

export function isPaymentDebugEnv(nodeEnv: string | undefined = process.env.NODE_ENV) {
  return nodeEnv === "development";
}

export function sanitizePaymentDebugMessage(input: unknown): string {
  const raw = input instanceof Error ? input.message : typeof input === "string" ? input : "";
  const sanitized = raw
    .replace(BEARER_PATTERN, "Bearer [redacted]")
    .replace(SECRET_PATTERN, "$1[redacted]")
    .replace(/\s+/g, " ")
    .trim();

  if (!sanitized) {
    return "";
  }

  return sanitized.length > DEBUG_MESSAGE_MAX_LENGTH
    ? `${sanitized.slice(0, DEBUG_MESSAGE_MAX_LENGTH - 1)}…`
    : sanitized;
}

export function publicPaymentErrorPayload(
  technical: unknown,
  kind: PublicPaymentErrorKind = "internal",
  nodeEnv: string | undefined = process.env.NODE_ENV,
) {
  const debug = sanitizePaymentDebugMessage(technical);

  if (kind === "validation") {
    return {
      error: debug || "Revisa los datos ingresados e inténtalo nuevamente.",
    };
  }

  if (isPaymentDebugEnv(nodeEnv) && debug) {
    return { error: debug };
  }

  return { error: PUBLIC_PAYMENT_ERROR_MESSAGE };
}

export function isAbortOrTimeoutError(error: unknown) {
  if (!error || typeof error !== "object" || !("name" in error)) {
    return false;
  }

  const name = String((error as { name?: unknown }).name ?? "");
  return name === "AbortError" || name === "TimeoutError";
}

export async function readResponseJson(response: Response): Promise<Record<string, unknown>> {
  try {
    const payload = await response.json();
    return payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function technicalFromFailure(input: {
  apiError?: string | null;
  caught?: unknown;
}) {
  if (input.apiError?.trim()) {
    return sanitizePaymentDebugMessage(input.apiError);
  }

  if (isAbortOrTimeoutError(input.caught)) {
    return "La solicitud de pago superó el tiempo de espera.";
  }

  if (input.caught instanceof Error) {
    return sanitizePaymentDebugMessage(input.caught.message);
  }

  return "No se pudo iniciar el pago.";
}

export function resolvePublicPaymentFailure(input: {
  status?: number;
  apiError?: string | null;
  caught?: unknown;
  nodeEnv?: string;
}): { message: string; debug?: string } {
  const technical = technicalFromFailure(input);
  const isSafeClientStatus =
    (input.status === 400 || input.status === 404 || input.status === 409) && Boolean(technical);

  if (isSafeClientStatus) {
    return { message: technical };
  }

  if (isPaymentDebugEnv(input.nodeEnv)) {
    return {
      message: PUBLIC_PAYMENT_ERROR_MESSAGE,
      debug: technical,
    };
  }

  return { message: PUBLIC_PAYMENT_ERROR_MESSAGE };
}
