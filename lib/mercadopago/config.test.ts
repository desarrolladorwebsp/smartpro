import test from "node:test";
import assert from "node:assert/strict";

import { getAppBaseUrl } from "./config";
import { getCheckoutRedirectUrl } from "./preference";

test("getAppBaseUrl exige APP_URL y no usa localhost implícito", () => {
  const previous = process.env.APP_URL;

  try {
    delete process.env.APP_URL;
    assert.throws(() => getAppBaseUrl(), /APP_URL/);

    process.env.APP_URL = "https://smartpro.cl/";
    assert.equal(getAppBaseUrl(), "https://smartpro.cl");
  } finally {
    if (previous === undefined) {
      delete process.env.APP_URL;
    } else {
      process.env.APP_URL = previous;
    }
  }
});

test("usa sandbox_init_point con credenciales de prueba", () => {
  const previous = process.env.MERCADOPAGO_ACCESS_TOKEN;

  try {
    process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST-abc";

    const url = getCheckoutRedirectUrl({
      init_point: "https://www.mercadopago.cl/checkout/v1/redirect?pref_id=prod",
      sandbox_init_point: "https://sandbox.mercadopago.cl/checkout/v1/redirect?pref_id=test",
    });

    assert.equal(url, "https://sandbox.mercadopago.cl/checkout/v1/redirect?pref_id=test");
  } finally {
    if (previous === undefined) {
      delete process.env.MERCADOPAGO_ACCESS_TOKEN;
    } else {
      process.env.MERCADOPAGO_ACCESS_TOKEN = previous;
    }
  }
});
