import { Webhook } from "svix";
import { prisma } from "@/lib/db";
import { recordZoomInvitationDelivery } from "@/lib/email/zoom-delivery";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (!secret || !prisma) return Response.json({ error: "Webhook no configurado." }, { status: 503 });

  let payload: unknown;
  try {
    const body = await request.text();
    new Webhook(secret).verify(body, {
      "svix-id": request.headers.get("svix-id") ?? "",
      "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
      "svix-signature": request.headers.get("svix-signature") ?? "",
    });
    payload = JSON.parse(body);
  } catch {
    return Response.json({ error: "Firma inválida." }, { status: 400 });
  }

  try {
    await recordZoomInvitationDelivery(prisma, payload);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[smartpro:resend] No se pudo registrar el estado de entrega.", error);
    return Response.json({ error: "No se pudo registrar el evento." }, { status: 503 });
  }
}
