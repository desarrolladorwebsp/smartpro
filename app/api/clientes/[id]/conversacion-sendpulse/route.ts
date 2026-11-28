import { getCurrentAdminSession } from "@/lib/auth";
import { getCachedSendpulseConversation, refreshSendpulseConversation, SendpulseContactOutsideBot } from "@/lib/sendpulse/conversation";
import { listSendpulseConversations } from "@/lib/sendpulse/conversation-access";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };
const privateResponse = { headers: { "Cache-Control": "private, no-store" } };

async function conversation(request: Request, { params }: Context, refresh: boolean) {
  const session = await getCurrentAdminSession();
  if (!session) return Response.json({ error: "Inicia sesión para consultar la conversación." }, { status: 401 });

  const { id } = await params;
  const externalId: unknown = refresh
    ? (await request.json().catch(() => null))?.externalId
    : new URL(request.url).searchParams.get("externalId");
  if (typeof externalId !== "string" || !externalId || externalId.length > 128) {
    return Response.json({ error: "Selecciona una conversación válida." }, { status: 400 });
  }

  try {
    const [conversation] = await listSendpulseConversations(id, session, externalId);
    if (!conversation) return Response.json({ error: "La conversación no está disponible para este cliente." }, { status: 404 });
    const botId = process.env.SENDPULSE_WHATSAPP_BOT_ID?.trim();
    if (!refresh) return Response.json(botId ? getCachedSendpulseConversation(conversation.externalId, botId) : null, privateResponse);

    const apiKey = process.env.SENDPULSE_CHAT_API_KEY?.trim();
    if (!apiKey) return Response.json({ error: "La consulta de conversaciones de SendPulse necesita una clave configurada." }, { status: 503 });
    if (!botId) return Response.json({ error: "Falta configurar el bot autorizado de SendPulse." }, { status: 503 });

    const snapshot = await refreshSendpulseConversation(conversation.externalId, apiKey, botId);
    return Response.json(snapshot, privateResponse);
  } catch (error) {
    if (error instanceof SendpulseContactOutsideBot) {
      return Response.json({ error: "La conversación no pertenece al bot autorizado de SmartPro." }, { status: 403, ...privateResponse });
    }
    return Response.json({ error: "No se pudo actualizar la conversación de SendPulse. Intenta nuevamente." }, { status: 502 });
  }
}

export function GET(request: Request, context: Context) {
  return conversation(request, context, false);
}

export function POST(request: Request, context: Context) {
  return conversation(request, context, true);
}
