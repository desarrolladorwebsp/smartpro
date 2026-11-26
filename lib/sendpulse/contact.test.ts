import assert from "node:assert/strict";
import test from "node:test";
import { parseIncomingContacts } from "./contact";

test("filtra por bot y mensaje entrante y conserva solo los datos del contacto", () => {
  const message = {
    service: "whatsapp",
    title: "incoming_message",
    bot: { id: "smartpro" },
    contact: { id: "contact-1", name: "Cliente de prueba", last_message: "texto privado" },
    info: { message: { channel_data: { message: { type: "text", from: 56912345678, text: { body: "texto privado" } } } } },
  };

  assert.deepEqual(parseIncomingContacts([
    { ...message, title: "outgoing_message" },
    { ...message, bot: { id: "otro-bot" } },
    { ...message, service: "telegram" },
    message,
    message,
  ], "smartpro"), [{ id: "contact-1", name: "Cliente de prueba", phone: "56912345678" }]);
});
