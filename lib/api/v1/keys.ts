import crypto from "node:crypto";

export const PUBLIC_KEY_PREFIX = "pk_";
export const SECRET_KEY_PREFIX = "sk_";

export type ApiKeyEnvironment = "live" | "test";

export type GeneratedApiCredentials = {
  publicKey: string;
  secretKey: string;
  secretHash: string;
  secretPreview: string;
};

/// Las claves son aleatorias de alta entropía, por lo que basta un HMAC del
/// secreto con una pimienta del servidor para guardarlas: es irreversible y
/// se verifica en microsegundos, a diferencia de scrypt.
export function getApiKeyPepper(): string {
  const pepper = process.env.API_KEY_PEPPER?.trim() || process.env.ADMIN_SESSION_SECRET?.trim();

  if (!pepper) {
    throw new Error("Falta API_KEY_PEPPER (o ADMIN_SESSION_SECRET) para firmar las claves de la API.");
  }

  return pepper;
}

export function hashApiSecret(secretKey: string, pepper = getApiKeyPepper()): string {
  return crypto.createHmac("sha256", pepper).update(secretKey.trim()).digest("hex");
}

export function isPublicKeyFormat(value: string): boolean {
  return /^pk_(live|test)_[A-Za-z0-9_-]{24,}$/.test(value.trim());
}

export function isSecretKeyFormat(value: string): boolean {
  return /^sk_(live|test)_[A-Za-z0-9_-]{32,}$/.test(value.trim());
}

export function buildSecretPreview(secretKey: string): string {
  const trimmed = secretKey.trim();
  const tail = trimmed.slice(-4);
  const prefix = trimmed.split("_").slice(0, 2).join("_");
  return `${prefix}_…${tail}`;
}

export function generateApiCredentials(environment: ApiKeyEnvironment = "live"): GeneratedApiCredentials {
  const publicKey = `${PUBLIC_KEY_PREFIX}${environment}_${crypto.randomBytes(24).toString("base64url")}`;
  const secretKey = `${SECRET_KEY_PREFIX}${environment}_${crypto.randomBytes(32).toString("base64url")}`;

  return {
    publicKey,
    secretKey,
    secretHash: hashApiSecret(secretKey),
    secretPreview: buildSecretPreview(secretKey),
  };
}

/// Deriva el secreto de firma de los webhooks salientes a partir del secreto
/// del servidor, para no tener que almacenarlo en texto plano.
export function deriveWebhookSecret(apiClientId: string, pepper = getApiKeyPepper()): string {
  return crypto.createHmac("sha256", pepper).update(`webhook:${apiClientId}`).digest("hex");
}

export function readBearerToken(header: string | null | undefined): string | null {
  if (!header) {
    return null;
  }

  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || null;
}
