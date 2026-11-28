import assert from "node:assert/strict";
import test from "node:test";

import { getCachedSendpulseConversation, refreshSendpulseConversation, SendpulseContactOutsideBot } from "./conversation";

const authorizedBot = "smartpro-whatsapp";
const otherBot = "other-whatsapp";
const internalContact = "test-contact";
const chatKey = "dedicated-test-key";

test("verifica el bot antes de leer mensajes y reutiliza la consulta dentro del mismo bot", async (t) => {
  const paths: string[] = [];
  t.mock.method(globalThis, "fetch", async (url: URL, init: RequestInit) => {
    assert.equal(new Headers(init.headers).get("Authorization"), `Bearer ${chatKey}`);
    assert.equal(init.method ?? "GET", "GET");
    paths.push(url.pathname);
    if (url.pathname === "/whatsapp/contacts/get") {
      assert.equal(url.searchParams.get("id"), internalContact);
      return Response.json({ success: true, data: { id: internalContact, bot_id: authorizedBot } });
    }
    assert.equal(url.pathname, "/whatsapp/chats/messages");
    assert.equal(url.searchParams.get("contact_id"), internalContact);
    return Response.json({ success: true, data: [{ id: "test-message", direction: 1, type: "text", data: { text: "Mensaje interno de prueba" } }] });
  });

  const conversations = await Promise.all([
    refreshSendpulseConversation(internalContact, chatKey, authorizedBot),
    refreshSendpulseConversation(internalContact, chatKey, authorizedBot),
  ]);
  assert.deepEqual(paths, ["/whatsapp/contacts/get", "/whatsapp/chats/messages"]);
  assert.equal(conversations[0].messages[0]?.text, "Mensaje interno de prueba");
  assert.equal(conversations[0], conversations[1]);
  assert.equal(getCachedSendpulseConversation(internalContact, otherBot), null);
  await assert.rejects(refreshSendpulseConversation(internalContact, chatKey, otherBot), SendpulseContactOutsideBot);
  assert.deepEqual(paths, ["/whatsapp/contacts/get", "/whatsapp/chats/messages", "/whatsapp/contacts/get"]);
});

test("bloquea el historial de otro bot, contactos distintos e identidad incompleta", async (t) => {
  const records = new Map([
    ["foreign-contact", { id: "foreign-contact", bot_id: otherBot }],
    ["invalid-contact", { id: "another-contact", bot_id: authorizedBot }],
    ["no-bot", { id: "no-bot" }],
  ]);
  const fetchMock = t.mock.method(globalThis, "fetch", async (url: URL) => {
    assert.equal(url.pathname, "/whatsapp/contacts/get");
    return Response.json({ success: true, data: records.get(url.searchParams.get("id") ?? "") });
  });
  for (const id of records.keys()) {
    await assert.rejects(refreshSendpulseConversation(id, chatKey, authorizedBot), SendpulseContactOutsideBot);
    assert.equal(getCachedSendpulseConversation(id, authorizedBot), null);
  }
  assert.equal(fetchMock.mock.callCount(), records.size);
});
