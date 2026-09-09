import test from "node:test";
import assert from "node:assert/strict";

import { sendEmail, sendPlainTextEmail } from "./resend";

test("sendEmail no envía si falta el destinatario o el asunto", async () => {
  await assert.rejects(() => sendEmail({ to: "  ", subject: "Hola", text: "Cuerpo" }), /destinatario/);
  await assert.rejects(() => sendEmail({ to: "a@smartpro.cl", subject: " ", text: "Cuerpo" }), /asunto/);
  await assert.rejects(() => sendEmail({ to: "a@smartpro.cl", subject: "Hola", text: " " }), /texto plano/);
});

test("sendEmail no llama a Resend si falta RESEND_API_KEY", async () => {
  const previous = process.env.RESEND_API_KEY;
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;

  try {
    delete process.env.RESEND_API_KEY;
    globalThis.fetch = async () => {
      fetchCalled = true;
      return new Response("ok", { status: 200 });
    };

    const result = await sendPlainTextEmail({
      to: "ejecutivo@smartpro.cl",
      subject: "Invitación al panel administrativo de SmartPro",
      text: "Hola",
    });

    assert.equal(result.delivered, false);
    assert.equal(result.provider, "console");
    assert.equal(fetchCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
    if (previous === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = previous;
    }
  }
});

test("sendEmail captura errores del proveedor y no lanza", async () => {
  const previous = process.env.RESEND_API_KEY;
  const originalFetch = globalThis.fetch;

  try {
    process.env.RESEND_API_KEY = "re_test";
    globalThis.fetch = async () => new Response("invalid", { status: 401 });

    const result = await sendEmail({
      to: "ejecutivo@smartpro.cl",
      subject: "Invitación",
      text: "Hola",
      html: "<p>Hola</p>",
    });

    assert.equal(result.delivered, false);
    assert.equal(result.provider, "resend");
    assert.equal(result.error, "invalid");
  } finally {
    globalThis.fetch = originalFetch;
    if (previous === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = previous;
    }
  }
});
