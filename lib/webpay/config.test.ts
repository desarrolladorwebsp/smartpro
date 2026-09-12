import test from "node:test";
import assert from "node:assert/strict";

import { IntegrationApiKeys, IntegrationCommerceCodes } from "transbank-sdk";

import { getWebpayApiKey, getWebpayCommerceCode, getWebpayEnvironment, getWebpayReturnUrl } from "./config";
import { isAllowedWebpayRedirectUrl } from "./redirect";

function withEnv(vars: Record<string, string | undefined>, run: () => void) {
  const previous = Object.fromEntries(Object.keys(vars).map((key) => [key, process.env[key]]));

  try {
    for (const [key, value] of Object.entries(vars)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    run();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test("usa integración por defecto y credenciales públicas del SDK", () => {
  withEnv(
    {
      WEBPAY_ENV: undefined,
      WEBPAY_COMMERCE_CODE: undefined,
      WEBPAY_API_KEY: undefined,
    },
    () => {
      assert.equal(getWebpayEnvironment(), "integration");
      assert.equal(getWebpayCommerceCode(), IntegrationCommerceCodes.WEBPAY_PLUS);
      assert.equal(getWebpayApiKey(), IntegrationApiKeys.WEBPAY);
    },
  );
});

test("producción exige código de comercio y API key", () => {
  withEnv({ WEBPAY_ENV: "production", WEBPAY_COMMERCE_CODE: undefined, WEBPAY_API_KEY: undefined }, () => {
    assert.equal(getWebpayEnvironment(), "production");
    assert.throws(() => getWebpayCommerceCode(), /WEBPAY_COMMERCE_CODE/);
    assert.throws(() => getWebpayApiKey(), /WEBPAY_API_KEY/);
  });
});

test("construye returnUrl desde APP_URL", () => {
  withEnv({ APP_URL: "https://smartpro.cl/" }, () => {
    assert.equal(getWebpayReturnUrl(), "https://smartpro.cl/api/webpay/return");
  });
});

test("solo permite redirigir a hosts oficiales de Webpay", () => {
  assert.equal(isAllowedWebpayRedirectUrl("https://webpay3gint.transbank.cl/webpayserver/initTransaction"), true);
  assert.equal(isAllowedWebpayRedirectUrl("https://webpay3g.transbank.cl/webpayserver/initTransaction"), true);
  assert.equal(isAllowedWebpayRedirectUrl("http://webpay3gint.transbank.cl/webpayserver/initTransaction"), false);
  assert.equal(isAllowedWebpayRedirectUrl("https://evil.example/webpay"), false);
});
