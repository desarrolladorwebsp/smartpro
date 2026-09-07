import { isValidRut, normalizeRut } from "../rut";
import type { ExecutiveRole } from "./types";

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ExecutiveRegistrationInput = {
  firstName: string;
  lastName: string;
  rut: string;
  email: string;
  phone: string;
  password: string;
  role: ExecutiveRole;
};

export function parseExecutiveRegistration(body: {
  firstName?: string;
  lastName?: string;
  rut?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: string;
}): { ok: true; data: ExecutiveRegistrationInput } | { ok: false; error: string } {
  const firstName = String(body.firstName ?? "").trim();
  const lastName = String(body.lastName ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim();
  const rut = normalizeRut(String(body.rut ?? ""));
  const password = String(body.password ?? "").trim();
  const roleInput = String(body.role ?? "EXECUTIVE").trim().toUpperCase();

  if (!firstName || !lastName || !rut || !email || !password) {
    return { ok: false, error: "Nombre, apellido, RUT, correo y contraseña son obligatorios." };
  }

  if (!emailPattern.test(email)) {
    return { ok: false, error: "Correo electrónico inválido." };
  }

  if (password.length < 8) {
    return { ok: false, error: "La contraseña debe tener al menos 8 caracteres." };
  }

  if (!isValidRut(rut)) {
    return { ok: false, error: "RUT inválido." };
  }

  if (roleInput !== "EXECUTIVE" && roleInput !== "ADMIN") {
    return { ok: false, error: "Rol inválido." };
  }

  return {
    ok: true,
    data: {
      firstName,
      lastName,
      rut,
      email,
      phone,
      password,
      role: roleInput,
    },
  };
}
