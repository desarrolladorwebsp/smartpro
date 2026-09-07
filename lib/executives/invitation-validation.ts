import { normalizeRut } from "../rut";
import type { ExecutiveRole } from "./types";
import { emailPattern } from "./validation";

export type ExecutiveInviteInput = {
  email: string;
  role: ExecutiveRole;
};

export type InvitationAcceptInput = {
  token: string;
  firstName: string;
  lastName: string;
  rut: string;
  phone: string;
  password: string;
};

export function parseExecutiveInvite(body: {
  email?: string;
  role?: string;
}): { ok: true; data: ExecutiveInviteInput } | { ok: false; error: string } {
  const email = String(body.email ?? "").trim().toLowerCase();
  const roleInput = String(body.role ?? "EXECUTIVE").trim().toUpperCase();

  if (!email) {
    return { ok: false, error: "El correo electrónico es obligatorio." };
  }

  if (!emailPattern.test(email)) {
    return { ok: false, error: "Correo electrónico inválido." };
  }

  if (roleInput !== "EXECUTIVE" && roleInput !== "ADMIN") {
    return { ok: false, error: "Rol inválido." };
  }

  return {
    ok: true,
    data: {
      email,
      role: roleInput,
    },
  };
}

export function parseInvitationAccept(body: {
  token?: string;
  firstName?: string;
  lastName?: string;
  rut?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}): { ok: true; data: InvitationAcceptInput } | { ok: false; error: string } {
  const token = String(body.token ?? "").trim();
  const firstName = String(body.firstName ?? "").trim();
  const lastName = String(body.lastName ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const rut = normalizeRut(String(body.rut ?? ""));
  const password = String(body.password ?? "").trim();
  const confirmPassword = String(body.confirmPassword ?? "").trim();

  if (!token) {
    return { ok: false, error: "Token de invitación inválido." };
  }

  if (!firstName || !lastName || !rut || !password) {
    return { ok: false, error: "Nombre, apellido, RUT y contraseña son obligatorios." };
  }

  if (password.length < 8) {
    return { ok: false, error: "La contraseña debe tener al menos 8 caracteres." };
  }

  if (password !== confirmPassword) {
    return { ok: false, error: "Las contraseñas no coinciden." };
  }

  return {
    ok: true,
    data: {
      token,
      firstName,
      lastName,
      rut,
      phone,
      password,
    },
  };
}
