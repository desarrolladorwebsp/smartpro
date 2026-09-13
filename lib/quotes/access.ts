import crypto from "node:crypto";

import { getAppUrl } from "../app-url";

const TOKEN_VERSION = 1;

type QuoteAccessPayload = {
  v: number;
  q: string;
};

export type QuotePaymentUrls = {
  token: string;
  viewUrl: string;
  webpayUrl: string;
  mercadoPagoUrl: string;
  bankUrl: string;
};

function getQuoteAccessSecret(): string | null {
  const dedicated = process.env.QUOTE_ACCESS_SECRET?.trim();
  if (dedicated) return dedicated;

  const session = process.env.ADMIN_SESSION_SECRET?.trim();
  return session || null;
}

function signPayload(payloadBase64: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payloadBase64).digest("base64url");
}

function timingSafeEqual(left: string, right: string): boolean {
  try {
    const leftBuffer = Buffer.from(left, "base64url");
    const rightBuffer = Buffer.from(right, "base64url");
    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(leftBuffer, rightBuffer);
  } catch {
    return false;
  }
}

export function createQuoteAccessToken(quoteId: string, secret = getQuoteAccessSecret()): string | null {
  const id = String(quoteId ?? "").trim();
  if (!id || !secret) {
    return null;
  }

  const payload: QuoteAccessPayload = { v: TOKEN_VERSION, q: id };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${payloadBase64}.${signPayload(payloadBase64, secret)}`;
}

export function verifyQuoteAccessToken(token: string, secret = getQuoteAccessSecret()): string | null {
  if (!secret) {
    return null;
  }

  const value = String(token ?? "").trim();
  const separator = value.lastIndexOf(".");
  if (separator <= 0 || separator === value.length - 1) {
    return null;
  }

  const payloadBase64 = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  const expected = signPayload(payloadBase64, secret);

  if (!timingSafeEqual(expected, signature)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8")) as Partial<QuoteAccessPayload>;
    const quoteId = String(payload.q ?? "").trim();
    if (payload.v !== TOKEN_VERSION || !quoteId) {
      return null;
    }
    return quoteId;
  } catch {
    return null;
  }
}

export function tryGetAppUrl(): string | null {
  try {
    return getAppUrl();
  } catch {
    return null;
  }
}

export function buildQuotePaymentUrls(quoteId: string, appUrl = tryGetAppUrl()): QuotePaymentUrls | null {
  const token = createQuoteAccessToken(quoteId);
  const baseUrl = appUrl?.replace(/\/$/, "");
  if (!token || !baseUrl) {
    return null;
  }

  const viewUrl = `${baseUrl}/cotizacion/${token}`;
  return {
    token,
    viewUrl,
    webpayUrl: `${viewUrl}?pago=webpay`,
    mercadoPagoUrl: `${viewUrl}?pago=mercadopago`,
    bankUrl: `${viewUrl}#datos-bancarios`,
  };
}
