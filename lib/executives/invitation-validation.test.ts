import test from "node:test";
import assert from "node:assert/strict";

import { parseExecutiveInvite, parseInvitationAccept } from "./invitation-validation";

test("parseExecutiveInvite acepta datos válidos", () => {
  const result = parseExecutiveInvite({
    email: "Ejecutivo@SmartPro.cl",
    role: "ADMIN",
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.email, "ejecutivo@smartpro.cl");
    assert.equal(result.data.role, "ADMIN");
  }
});

test("parseExecutiveInvite rechaza email inválido", () => {
  const result = parseExecutiveInvite({ email: "invalid", role: "EXECUTIVE" });
  assert.equal(result.ok, false);
});

test("parseInvitationAccept exige contraseñas coincidentes", () => {
  const result = parseInvitationAccept({
    token: "abc",
    firstName: "Ana",
    lastName: "Lopez",
    rut: "11111111-1",
    password: "password123",
    confirmPassword: "password124",
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.error, /contraseñas/i);
  }
});
