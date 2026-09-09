import { MercadoPagoConfig } from "mercadopago";

export function getAppBaseUrl(): string {
  const url = process.env.APP_URL?.trim();

  if (!url) {
    throw new Error("Falta APP_URL para construir las URLs de Mercado Pago.");
  }

  return url.replace(/\/$/, "");
}

export function getMercadoPagoAccessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();

  if (!token) {
    throw new Error("Falta MERCADOPAGO_ACCESS_TOKEN.");
  }

  return token;
}

export function getMercadoPagoWebhookSecret(): string {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();

  if (!secret) {
    throw new Error("Falta MERCADOPAGO_WEBHOOK_SECRET.");
  }

  return secret;
}

export function isMercadoPagoTestCredentials(token = getMercadoPagoAccessToken()): boolean {
  return token.startsWith("TEST-");
}

export function createMercadoPagoClient(): MercadoPagoConfig {
  return new MercadoPagoConfig({
    accessToken: getMercadoPagoAccessToken(),
  });
}
