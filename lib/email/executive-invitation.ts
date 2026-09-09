import { EMAIL_BRAND, normalizeAppUrl } from "./brand";
import { renderCorporateEmail } from "./template";

export const EXECUTIVE_INVITATION_SUBJECT = "Invitación al panel administrativo de SmartPro";

export type ExecutiveInvitationEmailInput = {
  roleLabel: string;
  inviteUrl: string;
  appUrl: string;
};

export function buildExecutiveInvitationEmail(input: ExecutiveInvitationEmailInput) {
  const appUrl = normalizeAppUrl(input.appUrl);
  const roleLabel = input.roleLabel.trim();

  if (!roleLabel) {
    throw new Error("El rol asignado es obligatorio para el correo de invitación.");
  }

  const { html, text } = renderCorporateEmail({
    title: EXECUTIVE_INVITATION_SUBJECT,
    preheader: "Has sido invitado/a a unirte al panel administrativo de SmartPro.",
    heading: "Invitación al panel administrativo",
    greeting: "Hola,",
    intro: "Has sido invitado/a a unirte al panel administrativo de SmartPro.",
    highlight: {
      label: "Rol asignado",
      value: roleLabel,
    },
    actionText: "Para completar tu cuenta y crear tu contraseña, abre el siguiente enlace:",
    cta: {
      href: input.inviteUrl,
      label: "Completar invitación",
    },
    notices: ["Este enlace expira en 72 horas y solo puede usarse una vez."],
    closing: "Si no esperabas esta invitación, puedes ignorar este correo.",
    signature: EMAIL_BRAND.signature,
    appUrl,
  });

  return {
    subject: EXECUTIVE_INVITATION_SUBJECT,
    html,
    text,
  };
}
