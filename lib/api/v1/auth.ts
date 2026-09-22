import { isOriginAllowed, normalizeOrigin } from "./cors";
import { ApiError } from "./errors";
import { isPublicKeyFormat, isSecretKeyFormat, readBearerToken } from "./keys";
import { findApiClientByPublicKey, findApiClientBySecret } from "./repository";
import {
  canonicalRequestPath,
  PUBLIC_KEY_HEADER,
  SIGNATURE_HEADER,
  TIMESTAMP_HEADER,
  verifyRequestSignature,
} from "./signature";
import { isPublishableScope, type ApiAuthContext, type ApiClientRecord, type ApiScope } from "./types";

export type AuthenticateInput = {
  request: Request;
  rawBody: string;
  scope: ApiScope;
  requireSecret: boolean;
  requestId: string;
  secretKeyResolver?: (secretKey: string) => Promise<ApiClientRecord | null>;
  publicKeyResolver?: (publicKey: string) => Promise<ApiClientRecord | null>;
  nowMs?: number;
};

function assertUsable(client: ApiClientRecord) {
  if (client.status === "REVOKED") {
    throw new ApiError("invalid_credentials", "La credencial fue revocada.");
  }

  if (client.status === "SUSPENDED") {
    throw new ApiError("client_suspended", "La aplicación está suspendida. Contacta a SmartPro.");
  }
}

function assertScope(client: ApiClientRecord, scope: ApiScope) {
  if (!client.scopes.includes(scope)) {
    throw new ApiError("insufficient_scope", `La credencial no tiene el permiso "${scope}".`, { requiredScope: scope });
  }
}

async function authenticateWithSecret(input: AuthenticateInput, secretKey: string): Promise<ApiAuthContext> {
  if (!isSecretKeyFormat(secretKey)) {
    throw new ApiError("invalid_credentials", "La clave secreta no tiene un formato válido.");
  }

  const resolve = input.secretKeyResolver ?? findApiClientBySecret;
  const client = await resolve(secretKey);

  if (!client) {
    throw new ApiError("invalid_credentials", "La clave secreta no es válida.");
  }

  assertUsable(client);

  const verification = verifyRequestSignature({
    secret: secretKey,
    method: input.request.method,
    path: canonicalRequestPath(input.request.url),
    body: input.rawBody,
    signatureHeader: input.request.headers.get(SIGNATURE_HEADER),
    timestampHeader: input.request.headers.get(TIMESTAMP_HEADER),
    nowMs: input.nowMs,
  });

  if (!verification.ok) {
    if (verification.reason === "expired") {
      throw new ApiError(
        "signature_expired",
        "La firma expiró. Revisa el reloj del servidor y vuelve a firmar la solicitud.",
      );
    }

    if (verification.reason === "missing_signature") {
      throw new ApiError("invalid_signature", `Falta la cabecera ${SIGNATURE_HEADER}.`);
    }

    if (verification.reason === "missing_timestamp") {
      throw new ApiError("invalid_signature", `Falta la cabecera ${TIMESTAMP_HEADER}.`);
    }

    throw new ApiError("invalid_signature", "La firma de la solicitud no coincide.");
  }

  assertScope(client, input.scope);

  return {
    client,
    credential: "secret",
    origin: normalizeOrigin(input.request.headers.get("origin")),
    requestId: input.requestId,
  };
}

async function authenticateWithPublicKey(input: AuthenticateInput, publicKey: string): Promise<ApiAuthContext> {
  if (input.requireSecret || !isPublishableScope(input.scope)) {
    throw new ApiError(
      "invalid_credentials",
      "Esta operación exige clave secreta y firma HMAC desde tu servidor. La clave pública solo permite lecturas de catálogo.",
    );
  }

  if (!isPublicKeyFormat(publicKey)) {
    throw new ApiError("invalid_credentials", "La clave pública no tiene un formato válido.");
  }

  const resolve = input.publicKeyResolver ?? findApiClientByPublicKey;
  const client = await resolve(publicKey);

  if (!client) {
    throw new ApiError("invalid_credentials", "La clave pública no es válida.");
  }

  assertUsable(client);
  assertScope(client, input.scope);

  // El navegador siempre envía `Origin`; si viene, debe estar en la lista blanca.
  // Una llamada sin `Origin` (servidor a servidor) queda permitida porque estos
  // datos de catálogo son los mismos que se publican en el sitio web.
  const origin = normalizeOrigin(input.request.headers.get("origin"));

  if (origin && !isOriginAllowed(origin, client.allowedOrigins)) {
    throw new ApiError("origin_not_allowed", "El dominio de origen no está autorizado para esta credencial.", {
      origin,
    });
  }

  return {
    client,
    credential: "publishable",
    origin,
    requestId: input.requestId,
  };
}

export async function authenticateApiRequest(input: AuthenticateInput): Promise<ApiAuthContext> {
  const bearer = readBearerToken(input.request.headers.get("authorization"));

  if (bearer) {
    return authenticateWithSecret(input, bearer);
  }

  const publicKey = input.request.headers.get(PUBLIC_KEY_HEADER)?.trim();

  if (publicKey) {
    return authenticateWithPublicKey(input, publicKey);
  }

  throw new ApiError(
    "missing_credentials",
    `Falta la credencial. Usa "Authorization: Bearer sk_..." con firma HMAC, o la cabecera ${PUBLIC_KEY_HEADER} con tu clave pública para lecturas de catálogo.`,
  );
}
