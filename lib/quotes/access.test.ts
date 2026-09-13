import test from "node:test";
import assert from "node:assert/strict";

import { buildQuotePaymentUrls, createQuoteAccessToken, verifyQuoteAccessToken } from "./access";

const SECRET = "quote-access-test-secret";

test("el token HMAC identifica la cotización y rechaza firmas ajenas", () => {
  const token = createQuoteAccessToken("quote-1", SECRET);
  assert.ok(token);
  assert.equal(verifyQuoteAccessToken(token, SECRET), "quote-1");
  assert.equal(verifyQuoteAccessToken(token, "otra-clave"), null);
  assert.equal(verifyQuoteAccessToken("token-invalido", SECRET), null);
  assert.equal(verifyQuoteAccessToken("", SECRET), null);
});

test("un token de otra cotización no sirve para pagar una distinta", () => {
  const token = createQuoteAccessToken("quote-1", SECRET);
  assert.ok(token);
  assert.notEqual(verifyQuoteAccessToken(token, SECRET), "quote-2");
});

test("las URLs de pago no incluyen el monto ni el id crudo de la cotización", () => {
  const previousSecret = process.env.ADMIN_SESSION_SECRET;
  process.env.ADMIN_SESSION_SECRET = SECRET;

  try {
    const urls = buildQuotePaymentUrls("quote-secreta", "https://smartpro.cl");
    assert.ok(urls);
    assert.match(urls.viewUrl, /^https:\/\/smartpro\.cl\/cotizacion\//);
    assert.match(urls.webpayUrl, /pago=webpay/);
    assert.match(urls.mercadoPagoUrl, /pago=mercadopago/);
    assert.match(urls.bankUrl, /#datos-bancarios/);
    assert.doesNotMatch(urls.viewUrl, /quote-secreta/);
    assert.doesNotMatch(urls.webpayUrl, /119000|monto|amount/i);
  } finally {
    if (previousSecret === undefined) {
      delete process.env.ADMIN_SESSION_SECRET;
    } else {
      process.env.ADMIN_SESSION_SECRET = previousSecret;
    }
  }
});
