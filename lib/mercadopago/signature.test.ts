import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

import { InvalidWebhookSignatureError } from "mercadopago";

import { validateMercadoPagoWebhookSignature } from "./signature";

const secret = "test-webhook-secret";

function signedHeader(dataId: string, requestId: string, ts = "1704908010") {
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const hash = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  return { ts, hash, header: `ts=${ts},v1=${hash}` };
}

test("acepta una firma HMAC oficial válida", () => {
  const dataId = "123456";
  const requestId = "bb56a2f1-6aae-46ac-982e-9dcd3581d08e";
  const signed = signedHeader(dataId, requestId);

  assert.doesNotThrow(() =>
    validateMercadoPagoWebhookSignature({
      xSignature: signed.header,
      xRequestId: requestId,
      dataId,
      secret,
    }),
  );
});

test("rechaza una firma inválida", () => {
  assert.throws(
    () =>
      validateMercadoPagoWebhookSignature({
        xSignature: "ts=1704908010,v1=deadbeef",
        xRequestId: "req-1",
        dataId: "123456",
        secret,
      }),
    InvalidWebhookSignatureError,
  );
});

test("rechaza encabezados ausentes", () => {
  assert.throws(
    () =>
      validateMercadoPagoWebhookSignature({
        xSignature: null,
        xRequestId: "req-1",
        dataId: "123456",
        secret,
      }),
    InvalidWebhookSignatureError,
  );
});
