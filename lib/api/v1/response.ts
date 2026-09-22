import { NextResponse } from "next/server";

import { ApiError, isApiError, type ApiErrorCode } from "./errors";
import { API_VERSION, type ApiErrorEnvelope, type ApiSuccessEnvelope } from "./types";

export type ResponseOptions = {
  requestId: string;
  status?: number;
  headers?: Record<string, string>;
  count?: number;
};

const BASE_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

export function buildSuccessEnvelope<T>(data: T, options: ResponseOptions): ApiSuccessEnvelope<T> {
  return {
    data,
    meta: {
      requestId: options.requestId,
      apiVersion: API_VERSION,
      ...(typeof options.count === "number" ? { count: options.count } : {}),
    },
  };
}

export function buildErrorEnvelope(
  code: ApiErrorCode | string,
  message: string,
  requestId: string,
  details?: unknown,
): ApiErrorEnvelope {
  return {
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
    meta: {
      requestId,
      apiVersion: API_VERSION,
    },
  };
}

export function apiSuccess<T>(data: T, options: ResponseOptions): NextResponse {
  return NextResponse.json(buildSuccessEnvelope(data, options), {
    status: options.status ?? 200,
    headers: { ...BASE_HEADERS, ...options.headers },
  });
}

export function apiFailure(error: ApiError, options: ResponseOptions): NextResponse {
  return NextResponse.json(buildErrorEnvelope(error.code, error.message, options.requestId, error.details), {
    status: options.status ?? error.status,
    headers: { ...BASE_HEADERS, ...options.headers },
  });
}

/// Traduce cualquier excepción en una respuesta de error del contrato público,
/// sin dejar escapar mensajes internos de la base de datos o del gateway.
export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error;
  }

  const message = error instanceof Error ? error.message : "";

  if (message.includes("No hay conexión a la base de datos")) {
    return new ApiError("service_unavailable", "El servicio no está disponible en este momento.");
  }

  return new ApiError("internal_error", "Ocurrió un error inesperado al procesar la solicitud.");
}
