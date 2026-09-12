import { IntegrationApiKeys, IntegrationCommerceCodes, WebpayPlus } from "transbank-sdk";

import { getAppUrl } from "../app-url";

export type WebpayEnvironment = "integration" | "production";

export function getWebpayEnvironment(): WebpayEnvironment {
  const value = String(process.env.WEBPAY_ENV ?? "integration").trim().toLowerCase();
  return value === "production" ? "production" : "integration";
}

export function getWebpayCommerceCode(): string {
  const configured = process.env.WEBPAY_COMMERCE_CODE?.trim();
  if (configured) return configured;

  if (getWebpayEnvironment() === "production") {
    throw new Error("Falta WEBPAY_COMMERCE_CODE para el ambiente de producción.");
  }

  return IntegrationCommerceCodes.WEBPAY_PLUS;
}

export function getWebpayApiKey(): string {
  const configured = process.env.WEBPAY_API_KEY?.trim();
  if (configured) return configured;

  if (getWebpayEnvironment() === "production") {
    throw new Error("Falta WEBPAY_API_KEY para el ambiente de producción.");
  }

  return IntegrationApiKeys.WEBPAY;
}

export function getWebpayTransaction() {
  const commerceCode = getWebpayCommerceCode();
  const apiKey = getWebpayApiKey();

  if (getWebpayEnvironment() === "production") {
    return WebpayPlus.Transaction.buildForProduction(commerceCode, apiKey);
  }

  return WebpayPlus.Transaction.buildForIntegration(commerceCode, apiKey);
}

export function getWebpayReturnUrl() {
  return `${getAppUrl()}/api/webpay/return`;
}
