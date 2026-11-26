import { matchesToken, parseIncomingContacts } from "@/lib/sendpulse/contact";
import { registerSendpulseContact } from "@/lib/sendpulse/import-contact";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.SENDPULSE_INCOMING_TOKEN?.trim();
  const botId = process.env.SENDPULSE_WHATSAPP_BOT_ID?.trim();
  if (!secret || !botId) return new Response(null, { status: 503 });

  // Bot-level webhooks in SendPulse only accept a URL, with no custom headers.
  const token = new URL(request.url).searchParams.get("key") ?? "";
  if (!matchesToken(token, secret)) return new Response(null, { status: 401 });

  const events: unknown = await request.json().catch(() => null);
  if (!Array.isArray(events)) return new Response(null, { status: 400 });

  // Only pass contact fields to the CRM. Never store or log the message payload.
  let status = 200;
  for (const action of parseIncomingContacts(events, botId)) {
    status = Math.max(status, await registerSendpulseContact(action));
  }
  return new Response(null, { status });
}
