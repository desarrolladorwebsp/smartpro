import test from "node:test";
import assert from "node:assert/strict";

import { sendEmail, sendPlainTextEmail } from "./resend";
import { buildZoomInvitationEmail } from "./zoom-invitation";

test("sendEmail no envía si falta el destinatario o el asunto", async () => {
  await assert.rejects(() => sendEmail({ to: "  ", subject: "Hola", text: "Cuerpo" }), /destinatario/);
  await assert.rejects(() => sendEmail({ to: "a@smartpro.cl", subject: " ", text: "Cuerpo" }), /asunto/);
  await assert.rejects(() => sendEmail({ to: "a@smartpro.cl", subject: "Hola", text: " " }), /texto plano/);
});

test("sendEmail no llama a Resend si falta RESEND_API_KEY", async () => {
  const previous = process.env.RESEND_API_KEY;
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;

  try {
    delete process.env.RESEND_API_KEY;
    globalThis.fetch = async () => {
      fetchCalled = true;
      return new Response("ok", { status: 200 });
    };

    const result = await sendPlainTextEmail({
      to: "ejecutivo@smartpro.cl",
      subject: "Invitación al panel administrativo de SmartPro",
      text: "Hola",
    });

    assert.equal(result.delivered, false);
    assert.equal(result.provider, "console");
    assert.equal(fetchCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
    if (previous === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = previous;
    }
  }
});

test("sendEmail captura errores del proveedor y no lanza", async () => {
  const previous = process.env.RESEND_API_KEY;
  const originalFetch = globalThis.fetch;

  try {
    process.env.RESEND_API_KEY = "re_test";
    globalThis.fetch = async () => new Response("invalid", { status: 401 });

    const result = await sendEmail({
      to: "ejecutivo@smartpro.cl",
      subject: "Invitación",
      text: "Hola",
      html: "<p>Hola</p>",
    });

    assert.equal(result.delivered, false);
    assert.equal(result.provider, "resend");
    assert.equal(result.error, "invalid");
  } finally {
    globalThis.fetch = originalFetch;
    if (previous === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = previous;
    }
  }
});

test("sendEmail incluye adjuntos PDF en la petición a Resend", async () => {
  const previous = process.env.RESEND_API_KEY;
  const originalFetch = globalThis.fetch;
  let body: Record<string, unknown> | null = null;

  try {
    process.env.RESEND_API_KEY = "re_test";
    globalThis.fetch = async (_input, init) => {
      body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      return new Response("ok", { status: 200 });
    };

    const result = await sendEmail({
      to: "cliente@empresa.cl",
      bcc: "contacto@smartpro.cl",
      subject: "Cotización COT-2026-0001 — SmartPro",
      text: "Adjuntamos la cotización.",
      html: "<p>Adjuntamos la cotización.</p>",
      attachments: [
        {
          filename: "COT-2026-0001.pdf",
          content: Buffer.from("%PDF-test"),
          contentType: "application/pdf",
        },
      ],
    });

    assert.equal(result.delivered, true);
    const parsed = body as { bcc?: string[]; attachments?: Array<{ filename?: string; content_type?: string }> } | null;
    assert.deepEqual(parsed?.bcc, ["contacto@smartpro.cl"]);
    assert.equal(parsed?.attachments?.[0]?.filename, "COT-2026-0001.pdf");
    assert.equal(parsed?.attachments?.[0]?.content_type, "application/pdf");
  } finally {
    globalThis.fetch = originalFetch;
    if (previous === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = previous;
    }
  }
});

test("la invitación de Zoom añade enlaces y un adjunto de calendario válido en ambos horarios de Chile", async (t) => {
  const requests: Array<{
    text: string;
    html: string;
    attachments: Array<{ filename: string; content: string; content_type: string }>;
  }> = [];
  const previousApiKey = process.env.RESEND_API_KEY;
  process.env.RESEND_API_KEY = "re_test";
  t.after(() => {
    if (previousApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousApiKey;
  });
  t.mock.method(globalThis, "fetch", async (_input: RequestInfo | URL, init?: RequestInit) => {
    requests.push(JSON.parse(String(init?.body)));
    return Response.json({ id: "email-test" });
  });

  for (const { date, hour } of [{ date: "2026-07-15", hour: "15" }, { date: "2026-11-18", hour: "14" }]) {
    const title = "Revisión, área comercial; 🗓️ ".repeat(5) + "\r\nATTENDEE:interno";
    const joinUrl = "https://zoom.us/j/123456789?pwd=example&tk=calendar";
    const meeting = { id: date, title, date, time: "11:30", duration: 40, joinUrl };
    const email = buildZoomInvitationEmail(meeting, "https://smartpro.cl");
    await sendEmail({ ...email, to: "destinatario@example.com" });

    const { html, text, attachments } = requests.at(-1)!;
    assert.match(html, /Añadir al calendario/);
    assert.match(html, /Unirse a la reunión/);
    assert.match(html, /pwd=example&amp;tk=calendar/);
    assert.equal(attachments[0].filename, "reunion-smartpro.ics");
    assert.equal(attachments[0].content_type, "text/calendar; charset=utf-8");

    const ics = Buffer.from(attachments[0].content, "base64").toString("utf8");
    assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
    assert.ok(ics.split("\r\n").every((line) => Buffer.byteLength(line) <= 75));
    const lines = ics.replace(/\r\n /g, "").split("\r\n");
    const day = date.replaceAll("-", "");
    assert.ok(lines.includes(`UID:${date}@smartpro.cl`));
    assert.ok(lines.includes(`DTSTART:${day}T${hour}3000Z`));
    assert.ok(lines.includes(`DTEND:${day}T${Number(hour) + 1}1000Z`));
    assert.ok(lines.includes(`DESCRIPTION:Unirse por Zoom: ${joinUrl}`));
    assert.ok(lines.includes(`SUMMARY:${"Revisión\\, área comercial\\; 🗓️ ".repeat(5)}\\nATTENDEE:interno`));
    assert.ok(!lines.some((line) => /^(ATTENDEE|ORGANIZER)[;:]/.test(line)));

    const google = new URL(text.match(/^Google Calendar: (.+)$/m)![1]);
    assert.equal(google.searchParams.get("dates"), `${day}T${hour}3000Z/${day}T${Number(hour) + 1}1000Z`);
    assert.equal(google.searchParams.get("text"), title);
    assert.equal(google.searchParams.get("details"), `Unirse por Zoom: ${joinUrl}`);
    for (const [label, host] of [["laboral", "outlook.office.com"], ["personal", "outlook.live.com"]]) {
      const outlook = new URL(text.match(new RegExp(`^Outlook ${label}: (.+)$`, "m"))![1]);
      assert.equal(outlook.hostname, host);
      assert.equal(outlook.searchParams.get("startdt"), `${date}T${hour}:30:00.000Z`);
      assert.equal(outlook.searchParams.get("enddt"), `${date}T${Number(hour) + 1}:10:00.000Z`);
      assert.equal(outlook.searchParams.get("body"), `Unirse por Zoom: ${joinUrl}`);
    }
  }
});
