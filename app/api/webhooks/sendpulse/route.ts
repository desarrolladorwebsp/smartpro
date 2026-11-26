import { prisma } from "@/lib/db";
import { fetchContactProfile, matchesWebhookToken, parseContactAction, resolveContact } from "@/lib/sendpulse/contact";
import { importSendpulseContact } from "@/lib/sendpulse/import-contact";

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

  try {
    if (!prisma) return result(false, 503);
    const linked = await prisma.sendpulseContact.findUnique({ where: { externalId: action.id } });
    if (linked) return result(true, 200);

    const apiKey = process.env.SENDPULSE_API_KEY?.trim();
    const profile = apiKey ? await fetchContactProfile(action.id, apiKey).catch(() => undefined) : undefined;
    const contact = resolveContact(action, profile);
    if (!contact) return result(false, apiKey && !profile ? 503 : 422);

    const imported = await importSendpulseContact(contact);
    return imported === "conflict" ? result(false, 409) : result(true, 200);
  } catch {
    console.error("[smartpro:sendpulse] No se pudo guardar la ficha.");
    return result(false, 503);
  }
}
