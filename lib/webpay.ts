import { IntegrationApiKeys, IntegrationCommerceCodes, WebpayPlus } from "transbank-sdk";

export function getWebpayTransaction() {
  const commerceCode = process.env.WEBPAY_COMMERCE_CODE ?? IntegrationCommerceCodes.WEBPAY_PLUS;
  const apiKey = process.env.WEBPAY_API_KEY ?? IntegrationApiKeys.WEBPAY;

  return WebpayPlus.Transaction.buildForIntegration(commerceCode, apiKey);
}

export function getAppBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000";
}

export function getWebpayReturnUrl() {
  return `${getAppBaseUrl().replace(/\/$/, "")}/api/webpay/return`;
}
