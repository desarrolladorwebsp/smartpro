type SendPlainTextEmailInput = {
  to: string;
  subject: string;
  text: string;
};

export async function sendPlainTextEmail(input: SendPlainTextEmailInput) {
  const from = process.env.EMAIL_FROM ?? "SmartPro <no-reply@smartpro.cl>";
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.info("[smartpro:email] Correo no enviado: RESEND_API_KEY no configurada.", {
      to: input.to,
      subject: input.subject,
    });
    return { delivered: false, provider: "console" as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    console.error("[smartpro:email] Error al enviar correo", message);
    return { delivered: false, provider: "resend" as const, error: message };
  }

  return { delivered: true, provider: "resend" as const };
}
