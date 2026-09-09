type SendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
};

export type SendEmailResult =
  | { delivered: true; provider: "resend" }
  | { delivered: false; provider: "console" | "resend"; error?: string };

function normalizeRecipients(to: string | string[]): string[] {
  const recipients = (Array.isArray(to) ? to : [to])
    .map((item) => item.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    throw new Error("El destinatario del correo es obligatorio.");
  }

  return recipients;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const subject = input.subject.trim();
  const text = input.text.trim();
  const html = input.html?.trim();

  if (!subject) {
    throw new Error("El asunto del correo es obligatorio.");
  }

  if (!text) {
    throw new Error("El texto plano del correo es obligatorio.");
  }

  const to = normalizeRecipients(input.to);
  const from = process.env.EMAIL_FROM?.trim() || "SmartPro <no-reply@smartpro.cl>";
  const resendApiKey = process.env.RESEND_API_KEY?.trim();

  if (!resendApiKey) {
    console.info("[smartpro:email] Correo no enviado: RESEND_API_KEY no configurada.", {
      to,
      subject,
    });
    return { delivered: false, provider: "console" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text,
        ...(html ? { html } : {}),
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      console.error("[smartpro:email] Error al enviar correo", message);
      return { delivered: false, provider: "resend", error: message };
    }

    return { delivered: true, provider: "resend" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error de red al enviar el correo.";
    console.error("[smartpro:email] Error al enviar correo", message);
    return { delivered: false, provider: "resend", error: message };
  }
}

export async function sendPlainTextEmail(input: Omit<SendEmailInput, "html">) {
  return sendEmail(input);
}
