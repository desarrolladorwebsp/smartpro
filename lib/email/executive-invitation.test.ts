import test from "node:test";
import assert from "node:assert/strict";

import { buildExecutiveInvitationEmail, EXECUTIVE_INVITATION_SUBJECT } from "./executive-invitation";

test("el correo de invitación conserva el contenido y usa APP_URL en logo y CTA", () => {
  const inviteUrl = "https://app.smartpro.cl/invitacion/ejecutivo?token=abc123";
  const email = buildExecutiveInvitationEmail({
    roleLabel: "Administrador",
    inviteUrl,
    appUrl: "https://app.smartpro.cl/",
  });

  assert.equal(email.subject, EXECUTIVE_INVITATION_SUBJECT);
  assert.match(email.text, /Hola,/);
  assert.match(email.text, /Has sido invitado\/a a unirte al panel administrativo de SmartPro/);
  assert.match(email.text, /Rol asignado: Administrador/);
  assert.match(email.text, /Para completar tu cuenta y crear tu contraseña/);
  assert.equal(email.text.includes(inviteUrl), true);
  assert.match(email.text, /Este enlace expira en 72 horas y solo puede usarse una vez/);
  assert.match(email.text, /Si no esperabas esta invitación, puedes ignorar este correo/);
  assert.match(email.text, /Equipo SmartPro/);

  assert.match(email.html, /Invitación al panel administrativo/);
  assert.match(email.html, /contraseña/);
  assert.match(email.html, /charset=UTF-8/);
  assert.match(email.html, /Administrador/);
  assert.match(email.html, /Rol asignado/);
  assert.match(email.html, /Completar invitación/);
  assert.match(email.html, /href="https:\/\/app\.smartpro\.cl\/invitacion\/ejecutivo\?token=abc123"/);
  assert.match(email.html, /https:\/\/app\.smartpro\.cl\/images\/logo\/logo-smartpro-01\.png/);
  assert.match(email.html, /72 horas/);
  assert.match(email.html, /solo puede usarse una vez/);
  assert.match(email.html, /Equipo SmartPro/);
  assert.doesNotMatch(email.html, /localhost/);
  assert.doesNotMatch(email.html, /<script[\s>]/i);
});

test("el correo de invitación rechaza un enlace que no use HTTP", () => {
  assert.throws(
    () =>
      buildExecutiveInvitationEmail({
        roleLabel: "Ejecutivo",
        inviteUrl: "ftp://smartpro.cl/invitacion",
        appUrl: "https://smartpro.cl",
      }),
    /HTTP o HTTPS/,
  );
});
