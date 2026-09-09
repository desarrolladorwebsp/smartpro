import test from "node:test";
import assert from "node:assert/strict";

import { EMAIL_BRAND, getEmailLogoUrl, normalizeAppUrl } from "./brand";
import { escapeHtml } from "./html";
import { renderCorporateEmail } from "./template";

test("normalizeAppUrl exige APP_URL válido y elimina el slash final", () => {
  assert.equal(normalizeAppUrl("https://smartpro.cl/"), "https://smartpro.cl");
  assert.throws(() => normalizeAppUrl(" "), /APP_URL/);
  assert.throws(() => normalizeAppUrl("ftp://smartpro.cl"), /HTTP/);
});

test("getEmailLogoUrl construye el logo con APP_URL y no hardcodea localhost", () => {
  const logoUrl = getEmailLogoUrl("https://smartpro.cl/");

  assert.equal(logoUrl, "https://smartpro.cl/images/logo/logo-smartpro-01.png");
  assert.doesNotMatch(logoUrl, /localhost/);
});

test("escapeHtml evita inyección en el HTML del correo", () => {
  assert.equal(escapeHtml(`Admin <img src=x>`), "Admin &lt;img src=x&gt;");
});

test("renderCorporateEmail reutiliza logo, paleta, CTA y firma", () => {
  const { html, text } = renderCorporateEmail({
    title: "Prueba SmartPro",
    preheader: "Vista previa",
    heading: "Asunto corporativo",
    greeting: "Hola,",
    intro: "Cuerpo del mensaje.",
    highlight: { label: "Rol asignado", value: 'Ejecutivo <script>' },
    actionText: "Continúa con el siguiente enlace:",
    cta: { href: "https://smartpro.cl/accion", label: "Completar invitación" },
    notices: ["Este enlace expira en 72 horas y solo puede usarse una vez."],
    closing: "Puedes ignorar este correo.",
    appUrl: "https://smartpro.cl",
  });

  assert.match(html, /logo-smartpro-01\.png/);
  assert.match(html, /https:\/\/smartpro\.cl\/images\/logo\/logo-smartpro-01\.png/);
  assert.match(html, /#101024/);
  assert.match(html, /#6D28D9/);
  assert.match(html, /#EC168C/);
  assert.match(html, /#FFFFFF|#fff/i);
  assert.match(html, /Completar invitación/);
  assert.match(html, /href="https:\/\/smartpro\.cl\/accion"/);
  assert.match(html, /Rol asignado/);
  assert.match(html, /Ejecutivo &lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /Equipo SmartPro/);
  assert.match(html, /max-width:600px/);
  assert.match(html, /@media only screen and \(max-width: 620px\)/);
  assert.doesNotMatch(html, /<script[\s>]/i);
  assert.doesNotMatch(html, /localhost/);
  assert.match(text, /Rol asignado: Ejecutivo <script>/);
  assert.match(text, /https:\/\/smartpro\.cl\/accion/);
  assert.match(text, /Equipo SmartPro/);
  assert.equal(text.includes(EMAIL_BRAND.signature), true);
});
