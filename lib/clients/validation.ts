export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ClientRegistrationInput = {
  firstName: string;
  lastName: string;
  businessName: string;
  rut: string;
  email: string;
  phone: string;
  password: string;
};

export function normalizeRut(value: string): string {
  const digits = value.replace(/[^0-9kK]/g, "");
  if (!digits) return "";

  const body = digits.slice(0, -1);
  const verifier = digits.slice(-1).toUpperCase();

  if (!body || !verifier) return "";

  return `${body}-${verifier}`;
}

export function parseClientRegistration(body: {
  firstName?: string;
  lastName?: string;
  businessName?: string;
  rut?: string;
  email?: string;
  phone?: string;
  password?: string;
}): { ok: true; data: ClientRegistrationInput } | { ok: false; error: string } {
  const firstName = String(body.firstName ?? "").trim();
  const lastName = String(body.lastName ?? "").trim();
  const businessName = String(body.businessName ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim();
  const rut = normalizeRut(String(body.rut ?? ""));
  const password = String(body.password ?? "").trim();

  if (!firstName || !lastName || !businessName || !email || !phone || !password) {
    return { ok: false, error: "Completa los campos obligatorios." };
  }

  if (!emailPattern.test(email)) {
    return { ok: false, error: "Correo electrónico inválido." };
  }

  if (phone.replace(/\D/g, "").length < 8) {
    return { ok: false, error: "Teléfono inválido." };
  }

  if (password.length < 8) {
    return { ok: false, error: "La contraseña debe tener al menos 8 caracteres." };
  }

  return {
    ok: true,
    data: {
      firstName,
      lastName,
      businessName,
      rut,
      email,
      phone,
      password,
    },
  };
}
