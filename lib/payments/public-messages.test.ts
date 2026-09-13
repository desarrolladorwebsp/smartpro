import test from "node:test";
import assert from "node:assert/strict";

import { getCheckoutPaymentWhatsAppUrl, SMARTPRO_WHATSAPP_NUMBER } from "../contact/whatsapp";
import {
  PUBLIC_PAYMENT_ERROR_MESSAGE,
  publicPaymentErrorPayload,
  resolvePublicPaymentFailure,
  sanitizePaymentDebugMessage,
} from "./public-messages";

test("producción oculta errores técnicos de pasarela y de API", () => {
  assert.equal(
    publicPaymentErrorPayload("No se pudo iniciar Mercado Pago", "gateway", "production").error,
    PUBLIC_PAYMENT_ERROR_MESSAGE,
  );
  assert.equal(
    publicPaymentErrorPayload("API connection failed", "internal", "production").error,
    PUBLIC_PAYMENT_ERROR_MESSAGE,
  );
  assert.equal(
    publicPaymentErrorPayload("Error al crear orden", "internal", "production").error,
    PUBLIC_PAYMENT_ERROR_MESSAGE,
  );
  assert.doesNotMatch(
    publicPaymentErrorPayload("token=APP_USR-123 response_code=5", "gateway", "production").error,
    /APP_USR|response_code/,
  );
});

test("desarrollo conserva un detalle técnico sanitizado para depuración", () => {
  assert.equal(
    publicPaymentErrorPayload("No se pudo iniciar el pago con Mercado Pago.", "gateway", "development").error,
    "No se pudo iniciar el pago con Mercado Pago.",
  );
  assert.doesNotMatch(
    publicPaymentErrorPayload("Authorization: Bearer secret-token-123", "internal", "development").error,
    /secret-token-123/,
  );
  assert.doesNotMatch(
    publicPaymentErrorPayload("access_token=APP_USR-abc", "internal", "development").error,
    /APP_USR-abc/,
  );
});

test("los errores de validación siguen siendo visibles para el cliente", () => {
  assert.equal(
    publicPaymentErrorPayload("Correo electrónico inválido.", "validation", "production").error,
    "Correo electrónico inválido.",
  );
  assert.equal(
    resolvePublicPaymentFailure({
      status: 400,
      apiError: "Faltan datos obligatorios del cliente.",
      nodeEnv: "production",
    }).message,
    "Faltan datos obligatorios del cliente.",
  );
  assert.equal(
    resolvePublicPaymentFailure({
      status: 409,
      apiError: "Esta cotización venció y ya no se puede pagar en línea.",
      nodeEnv: "production",
    }).message,
    "Esta cotización venció y ya no se puede pagar en línea.",
  );
});

test("en desarrollo el cliente ve el mensaje comercial y un detalle técnico", () => {
  const resolved = resolvePublicPaymentFailure({
    status: 502,
    apiError: "No se pudo iniciar el pago con Mercado Pago.",
    nodeEnv: "development",
  });

  assert.equal(resolved.message, PUBLIC_PAYMENT_ERROR_MESSAGE);
  assert.equal(resolved.debug, "No se pudo iniciar el pago con Mercado Pago.");
});

test("el cliente nunca muestra el detalle técnico en producción, aunque la API lo envíe", () => {
  const resolved = resolvePublicPaymentFailure({
    status: 502,
    apiError: "No se pudo iniciar Mercado Pago",
    nodeEnv: "production",
  });

  assert.equal(resolved.message, PUBLIC_PAYMENT_ERROR_MESSAGE);
  assert.equal(resolved.debug, undefined);
});

test("timeout y fallos de red se traducen a un mensaje comercial en producción", () => {
  const timeout = resolvePublicPaymentFailure({
    caught: Object.assign(new Error("The operation was aborted."), { name: "TimeoutError" }),
    nodeEnv: "production",
  });
  const network = resolvePublicPaymentFailure({
    caught: new Error("API connection failed"),
    nodeEnv: "production",
  });

  assert.equal(timeout.message, PUBLIC_PAYMENT_ERROR_MESSAGE);
  assert.equal(network.message, PUBLIC_PAYMENT_ERROR_MESSAGE);
});

test("sanitizePaymentDebugMessage no expone secretos ni payloads largos", () => {
  const sanitized = sanitizePaymentDebugMessage(
    "access_token=APP_USR-secret Bearer abc.def.ghi " + "x".repeat(400),
  );

  assert.match(sanitized, /\[redacted\]/);
  assert.doesNotMatch(sanitized, /APP_USR-secret/);
  assert.ok(sanitized.length <= 280);
});

test("el WhatsApp de checkout reutiliza el número corporativo y un mensaje de compra", () => {
  const url = getCheckoutPaymentWhatsAppUrl("SP-2026-100000");

  assert.match(url, new RegExp(SMARTPRO_WHATSAPP_NUMBER));
  assert.match(url, /wa\.me/);
  assert.match(decodeURIComponent(url), /problema al realizar el pago/);
  assert.match(decodeURIComponent(url), /SP-2026-100000/);
});
