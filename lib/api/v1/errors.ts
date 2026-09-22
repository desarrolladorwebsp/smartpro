export const API_ERROR_CODES = {
  invalid_request: 400,
  invalid_json: 400,
  validation_failed: 422,
  missing_credentials: 401,
  invalid_credentials: 401,
  invalid_signature: 401,
  signature_expired: 401,
  origin_not_allowed: 403,
  insufficient_scope: 403,
  client_suspended: 403,
  resource_not_found: 404,
  method_not_allowed: 405,
  idempotency_conflict: 409,
  resource_conflict: 409,
  rate_limited: 429,
  payment_gateway_error: 502,
  service_unavailable: 503,
  internal_error: 500,
} as const;

export type ApiErrorCode = keyof typeof API_ERROR_CODES;

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = API_ERROR_CODES[code];
    this.details = details;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

export function apiErrorStatus(code: ApiErrorCode): number {
  return API_ERROR_CODES[code];
}
