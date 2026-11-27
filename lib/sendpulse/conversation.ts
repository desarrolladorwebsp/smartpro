export type SendpulseMessage = {
  id: string;
  text: string;
  direction: "incoming" | "outgoing";
  sentAt: string | null;
};

export type SendpulseConversation = {
  refreshedAt: string;
  messages: SendpulseMessage[];
};

const MESSAGE_LIMIT = 50;
const REFRESH_INTERVAL_MS = 60_000;
const SNAPSHOT_TTL_MS = 15 * 60_000;
const MAX_SNAPSHOTS = 100;

const snapshots = new Map<string, SendpulseConversation>();
const refreshes = new Map<string, Promise<SendpulseConversation>>();

function record(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 4096) : "";
}

const attachmentNames = new Map([
  ["image", "Imagen"], ["audio", "Audio"], ["voice", "Nota de voz"],
  ["video", "Video"], ["document", "Documento"], ["sticker", "Sticker"],
  ["location", "Ubicación"], ["contacts", "Contacto"], ["template", "Mensaje de plantilla"],
]);
const messageTypes = new Set(["text", "interactive", "button", "userInput", ...attachmentNames.keys()]);

function asMessage(value: unknown): SendpulseMessage | null {
  const row = record(value);
  if (!row || !text(row.id) || (row.direction !== 1 && row.direction !== 2)) return null;
  const data = record(row.data);
  const interactive = record(data?.interactive);
  const type = text(row.type);
  if (!messageTypes.has(type) || row.status === 8) return null;
  const body = text(record(data?.text)?.body) || text(data?.text) ||
    text(record(interactive?.button_reply)?.title) || text(record(interactive?.list_reply)?.title) ||
    text(record(data?.button)?.text) || text(record(interactive?.body)?.text) ||
    text(record(data?.[type])?.caption) || attachmentNames.get(type);
  if (!body) return null;
  const sentAt = Date.parse(text(row.created_at));
  return {
    id: text(row.id), text: body, direction: row.direction === 1 ? "incoming" : "outgoing",
    sentAt: Number.isFinite(sentAt) ? new Date(sentAt).toISOString() : null,
  };
}

export function getCachedSendpulseConversation(externalId: string): SendpulseConversation | null {
  const snapshot = snapshots.get(externalId);
  if (!snapshot || Date.now() - Date.parse(snapshot.refreshedAt) >= SNAPSHOT_TTL_MS) return null;
  return snapshot;
}

async function fetchConversation(externalId: string, apiKey: string): Promise<SendpulseConversation> {
  const url = new URL("https://api.sendpulse.com/whatsapp/chats/messages");
  url.searchParams.set("contact_id", externalId);
  url.searchParams.set("size", String(MESSAGE_LIMIT));
  url.searchParams.set("order", "desc");
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error("SendPulse no pudo consultar la conversación.");

  const payload = record(await response.json());
  if (payload?.success !== true || !Array.isArray(payload.data)) throw new Error("SendPulse devolvió una conversación inválida.");

  const messages = payload.data.slice(0, MESSAGE_LIMIT).map(asMessage).filter((message) => message !== null);
  return { refreshedAt: new Date().toISOString(), messages: messages.reverse() };
}

export async function refreshSendpulseConversation(externalId: string, apiKey: string): Promise<SendpulseConversation> {
  const current = getCachedSendpulseConversation(externalId);
  if (current && Date.now() - Date.parse(current.refreshedAt) < REFRESH_INTERVAL_MS) return current;
  const inProgress = refreshes.get(externalId);
  if (inProgress) return inProgress;

  const request = fetchConversation(externalId, apiKey);
  refreshes.set(externalId, request);
  try {
    const snapshot = await request;
    snapshots.delete(externalId);
    snapshots.set(externalId, snapshot);
    if (snapshots.size > MAX_SNAPSHOTS) {
      const oldest = snapshots.keys().next();
      if (!oldest.done) snapshots.delete(oldest.value);
    }
    setTimeout(() => {
      if (snapshots.get(externalId) === snapshot) snapshots.delete(externalId);
    }, SNAPSHOT_TTL_MS).unref();
    return snapshot;
  } finally {
    refreshes.delete(externalId);
  }
}
