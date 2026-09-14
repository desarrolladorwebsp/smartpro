import test from "node:test";
import assert from "node:assert/strict";

import { getAppBaseUrl, getMercadoPagoPublicKey, isPublicHttpsAppUrl } from "./config";
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

test("isPublicHttpsAppUrl rechaza localhost y http", () => {
  assert.equal(isPublicHttpsAppUrl("http://localhost:3000"), false);
  assert.equal(isPublicHttpsAppUrl("https://localhost:3000"), false);
  assert.equal(isPublicHttpsAppUrl("https://smartpro.cl"), true);
});

test("getMercadoPagoPublicKey exige la public key del panel", () => {
  const previous = process.env.MERCADOPAGO_PUBLIC_KEY;

  try {
    delete process.env.MERCADOPAGO_PUBLIC_KEY;
    assert.throws(() => getMercadoPagoPublicKey(), /MERCADOPAGO_PUBLIC_KEY/);

    process.env.MERCADOPAGO_PUBLIC_KEY = "APP_USR-public-test";
    assert.equal(getMercadoPagoPublicKey(), "APP_USR-public-test");
  } finally {
    if (previous === undefined) {
      delete process.env.MERCADOPAGO_PUBLIC_KEY;
    } else {
      process.env.MERCADOPAGO_PUBLIC_KEY = previous;
    }
  }
});

test("usa init_point aunque existan credenciales de prueba", () => {
  const url = getCheckoutRedirectUrl({
    init_point: "https://www.mercadopago.cl/checkout/v1/redirect?pref_id=prod",
    sandbox_init_point: "https://sandbox.mercadopago.cl/checkout/v1/redirect?pref_id=test",
  });

  assert.equal(url, "https://www.mercadopago.cl/checkout/v1/redirect?pref_id=prod");
});
