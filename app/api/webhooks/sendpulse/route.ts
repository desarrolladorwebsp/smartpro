import { matchesWebhookToken, parseContactAction } from "@/lib/sendpulse/contact";
import { registerSendpulseContact } from "@/lib/sendpulse/import-contact";

export const runtime = "nodejs";

function result(ok: boolean, status: number) {
  return Response.json(ok, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const token = process.env.SENDPULSE_WEBHOOK_TOKEN?.trim();
  if (!token) return result(false, 503);
  if (!matchesWebhookToken(request.headers, token)) return result(false, 401);

  const action = parseContactAction(await request.json().catch(() => null));
  if (!action) return result(false, 400);

  const status = await registerSendpulseContact(action);
  return result(status === 200, status);
}
