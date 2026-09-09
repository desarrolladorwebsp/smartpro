import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

import { handleMercadoPagoWebhook } from "./webhook";

const secret = "webhook-secret";

function signedRequest(input: {
  paymentId: string;
  type?: string;
  status?: number;
  tamperSignature?: boolean;
}) {
  const requestId = "req-123";
  const ts = "1704908010";
  const manifest = `id:${input.paymentId};request-id:${requestId};ts:${ts};`;
  const hash = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  const signature = input.tamperSignature ? `ts=${ts},v1=invalid` : `ts=${ts},v1=${hash}`;

  return new Request(`https://smartpro.cl/api/mercadopago/webhook?data.id=${input.paymentId}&type=payment`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-signature": signature,
      "x-request-id": requestId,
    },
    body: JSON.stringify({
      type: input.type ?? "payment",
      action: "payment.updated",
      data: { id: input.paymentId },
    }),
  });
}

test("webhook válido consulta Mercado Pago y confirma el pago", async () => {
  const result = await handleMercadoPagoWebhook(signedRequest({ paymentId: "999" }), {
    getSecret: () => secret,
    getPayment: async (id) => ({
      id,
      status: "approved",
      external_reference: "SP-2026-1",
      transaction_amount: 119000,
    }),
    applyPayment: async (payment) => ({
      order: {
        id: "SP-2026-1",
        createdAt: new Date().toISOString(),
        orderStatus: "confirmed",
        status: "confirmed",
        customer: { name: "Ana", email: "ana@smartpro.cl", phone: "912345678" },
        items: [],
        subtotal: 100000,
        tax: 19000,
        total: 119000,
        paymentStatus: "paid",
        paymentMethod: "mercadopago",
        mercadopagoPaymentId: String(payment.id),
      },
      duplicate: false,
      emailSent: true,
    }),
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.ok, true);
  assert.equal(result.body.duplicate, false);
});

test("webhook duplicado responde 200 sin reprocesar como error", async () => {
  const result = await handleMercadoPagoWebhook(signedRequest({ paymentId: "999" }), {
    getSecret: () => secret,
    getPayment: async (id) => ({ id, status: "approved", external_reference: "SP-2026-1", transaction_amount: 119000 }),
    applyPayment: async () => ({
      order: {
        id: "SP-2026-1",
        createdAt: new Date().toISOString(),
        orderStatus: "confirmed",
        status: "confirmed",
        customer: { name: "Ana", email: "ana@smartpro.cl", phone: "912345678" },
        items: [],
        subtotal: 100000,
        tax: 19000,
        total: 119000,
        paymentStatus: "paid",
        paymentMethod: "mercadopago",
      },
      duplicate: true,
      emailSent: false,
    }),
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.duplicate, true);
});

test("webhook con firma inválida responde 401", async () => {
  const result = await handleMercadoPagoWebhook(signedRequest({ paymentId: "999", tamperSignature: true }), {
    getSecret: () => secret,
    getPayment: async () => {
      throw new Error("no debería consultar el pago");
    },
  });

  assert.equal(result.status, 401);
  assert.equal(result.body.ok, false);
});

test("error de Mercado Pago responde 500 para permitir reintentos", async () => {
  const result = await handleMercadoPagoWebhook(signedRequest({ paymentId: "999" }), {
    getSecret: () => secret,
    getPayment: async () => {
      throw new Error("Mercado Pago no disponible");
    },
  });

  assert.equal(result.status, 500);
  assert.equal(result.body.ok, false);
});
