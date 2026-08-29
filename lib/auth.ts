import crypto from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_SESSION_COOKIE = "smartpro_admin_session";
export const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 8;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function getAdminEmail(): string {
  return normalizeEmail(process.env.ADMIN_EMAIL ?? "");
}

export function getAdminSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();

  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET no está definido.");
  }

  return secret;
}

export function getAdminPasswordHash(): string {
  return process.env.ADMIN_PASSWORD_HASH?.trim() ?? "";
}

export function verifyPasswordHash(password: string, storedHash: string): boolean {
  if (!password || !storedHash || !storedHash.startsWith("scrypt$")) {
    return false;
  }

  const parts = storedHash.split("$");

  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return false;
  }

  const [, saltHex, expectedHex] = parts;

  if (!saltHex || !expectedHex) {
    return false;
  }

  try {
    const salt = Buffer.from(saltHex, "hex");
    const derived = crypto.scryptSync(password.normalize("NFKC"), salt, 64, { N: 16384, r: 8, p: 1 });
    const expected = Buffer.from(expectedHex, "hex");

    if (derived.length !== expected.length) {
      return false;
    }

    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function hashPassword(password: string): string {
  if (!password) {
    throw new Error("La contraseña no puede estar vacía.");
  }

  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password.normalize("NFKC"), salt, 64, { N: 16384, r: 8, p: 1 });

  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export function createSessionToken(email: string): string {
  const secret = getAdminSessionSecret();
  const payload = {
    sub: normalizeEmail(email),
    exp: Date.now() + ADMIN_SESSION_TTL_MS,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payloadBase64)
    .digest("base64url");

  return `${payloadBase64}.${signature}`;
}

export function verifySessionToken(token: string | undefined): { email: string } | null {
  if (!token) {
    return null;
  }

  const [payloadBase64, signature] = token.split(".");

  if (!payloadBase64 || !signature) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac("sha256", getAdminSessionSecret())
    .update(payloadBase64)
    .digest("base64url");

  try {
    if (!crypto.timingSafeEqual(Buffer.from(expectedSignature, "base64url"), Buffer.from(signature, "base64url"))) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8")) as {
      sub?: string;
      exp?: number;
    };

    if (!payload.sub || !payload.exp || payload.exp < Date.now()) {
      return null;
    }

    const email = normalizeEmail(payload.sub);

    if (!email) {
      return null;
    }

    return { email };
  } catch {
    return null;
  }
}

export async function getCurrentAdminSession(): Promise<{ email: string } | null> {
  const store = await cookies();
  const token = store.get(ADMIN_SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

export async function requireAdminSession(): Promise<{ email: string }> {
  const session = await getCurrentAdminSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
