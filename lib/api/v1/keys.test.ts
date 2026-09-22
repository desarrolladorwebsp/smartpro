import test from "node:test";
import assert from "node:assert/strict";

process.env.API_KEY_PEPPER = "pimienta-de-prueba";

import {
  buildSecretPreview,
  deriveWebhookSecret,
  generateApiCredentials,
  hashApiSecret,
  isPublicKeyFormat,
  isSecretKeyFormat,
  readBearerToken,
} from "./keys";

test("genera credenciales con el formato esperado", () => {
  const credentials = generateApiCredentials("live");

  assert.ok(isPublicKeyFormat(credentials.publicKey));
  assert.ok(isSecretKeyFormat(credentials.secretKey));
  assert.match(credentials.publicKey, /^pk_live_/);
  assert.match(credentials.secretKey, /^sk_live_/);
});

test("el ambiente de prueba usa prefijos separados", () => {
  const credentials = generateApiCredentials("test");

  assert.match(credentials.publicKey, /^pk_test_/);
  assert.match(credentials.secretKey, /^sk_test_/);
  assert.ok(isSecretKeyFormat(credentials.secretKey));
});

test("dos credenciales nunca coinciden", () => {
  const first = generateApiCredentials();
  const second = generateApiCredentials();

  assert.notEqual(first.secretKey, second.secretKey);
  assert.notEqual(first.publicKey, second.publicKey);
  assert.notEqual(first.secretHash, second.secretHash);
});

test("el hash del secreto es determinista y no reversible", () => {
  const { secretKey, secretHash } = generateApiCredentials();

  assert.equal(hashApiSecret(secretKey), secretHash);
  assert.equal(secretHash.length, 64);
  assert.ok(!secretHash.includes(secretKey));
});

test("la pimienta cambia el hash", () => {
  const secret = "sk_live_" + "a".repeat(40);

  assert.notEqual(hashApiSecret(secret, "pimienta-a"), hashApiSecret(secret, "pimienta-b"));
});

test("rechaza formatos de clave inválidos", () => {
  assert.ok(!isPublicKeyFormat("pk_live_corta"));
  assert.ok(!isPublicKeyFormat("sk_live_" + "a".repeat(40)));
  assert.ok(!isSecretKeyFormat("sk_prod_" + "a".repeat(40)));
  assert.ok(!isSecretKeyFormat(""));
});

test("la vista previa del secreto solo revela los últimos caracteres", () => {
  const secret = "sk_live_ejemplo-de-prueba-sin-valor-real-6789";

  assert.equal(buildSecretPreview(secret), "sk_live_…6789");
});

test("el secreto de webhooks se deriva del cliente y no se almacena", () => {
  const first = deriveWebhookSecret("client-1");

  assert.equal(first, deriveWebhookSecret("client-1"));
  assert.notEqual(first, deriveWebhookSecret("client-2"));
  assert.equal(first.length, 64);
});

test("lee el token del encabezado Authorization", () => {
  assert.equal(readBearerToken("Bearer sk_live_abc"), "sk_live_abc");
  assert.equal(readBearerToken("bearer   sk_live_abc  "), "sk_live_abc");
  assert.equal(readBearerToken("sk_live_abc"), null);
  assert.equal(readBearerToken(null), null);
});
