import { createHash, timingSafeEqual } from "node:crypto";
import { emailPattern } from "@/lib/clients/validation";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readText(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  const text = value.trim();
  return /\{\{.*\}\}/.test(text) ? "" : text.slice(0, max);
}

export function matchesWebhookToken(headers: Headers, secret: string) {
  const supplied = headers.get("authorization") ?? headers.get("bearer") ?? "";
  const token = supplied.trim().replace(/^Bearer\s+/i, "");
  return matchesToken(token, secret);
}

export function matchesToken(token: string, secret: string) {
  const hash = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(hash(token), hash(secret));
}

export function parseContactAction(value: unknown) {
  const input = asRecord(value);
  const id = readText(input.id, 129);
  if (!id || id.length > 128) return null;
  return { id, name: readText(input.nombre, 160), phone: readText(input.telefono, 40) };
}

export type ContactAction = NonNullable<ReturnType<typeof parseContactAction>>;

export function parseIncomingContacts(events: unknown[], botId: string): ContactAction[] {
  const contacts = new Map<string, ContactAction>();

  for (const event of events) {
    const { service, title, bot, contact, info } = asRecord(event);
    if (service !== "whatsapp" || title !== "incoming_message" || asRecord(bot).id !== botId) continue;

    const message = asRecord(asRecord(asRecord(asRecord(info).message).channel_data).message);
    if (message.type === "system") continue;

    const sender = typeof message.from === "number" && Number.isSafeInteger(message.from)
      ? String(message.from)
      : message.from;
    const subscriber = asRecord(contact);
    const action = parseContactAction({ id: subscriber.id, nombre: subscriber.name, telefono: sender });
    if (action && !contacts.has(action.id)) contacts.set(action.id, action);
  }
  return [...contacts.values()];
}

function normalizePhone(value: string) {
  if (!/^[+\d().\s-]+$/.test(value)) return "";
  const digits = value.replace(/\D/g, "").replace(/^00/, "");
  if (digits.length < 8 || digits.length > 15) return "";
  const chileanMobile = /^(?:56)?(9\d{8})$/.exec(digits);
  return `+${chileanMobile ? `56${chileanMobile[1]}` : digits}`;
}

export async function fetchContactProfile(id: string, apiKey: string) {
  const url = new URL("https://api.sendpulse.com/whatsapp/contacts/get");
  url.searchParams.set("id", id);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(4_000),
  });
  if (!response.ok) throw new Error("SendPulse no pudo consultar el contacto.");
  const data = asRecord(asRecord(await response.json()).data);
  const channel = asRecord(data.channel_data);
  const variables = asRecord(data.variables);
  return {
    name: readText(channel.name, 160) || readText(variables["nombre y apellido"], 160),
    phone: readText(channel.phone, 40) || readText(variables.phone, 40),
    email: readText(channel.email, 191) || readText(variables.email, 191) || readText(data.email, 191),
  };
}

export function resolveContact(action: ContactAction, profile?: Awaited<ReturnType<typeof fetchContactProfile>>) {
  const phone = normalizePhone(profile?.phone ?? "") || normalizePhone(action.phone);
  const email = (profile?.email ?? "").toLowerCase();
  const validEmail = emailPattern.test(email) ? email : "";
  if (!phone && !validEmail) return null;

  const name = (profile?.name || action.name || phone || validEmail).replace(/\s+/g, " ");
  const [firstName, ...lastName] = name.split(" ");
  return { externalId: action.id, firstName, lastName: lastName.join(" "), phone, email: validEmail };
}
