import test from "node:test";
import assert from "node:assert/strict";

import {
  createClientNote,
  createClientRecord,
  deleteClientRecord,
  getClientById,
  listClientNotes,
  listClients,
  updateClientRecord,
  updateClientStatus,
} from "./repository";

function computeRutVerifier(body: string): string {
  const factors = [3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;

  for (let index = body.length - 1, factorIndex = 0; index >= 0; index -= 1, factorIndex += 1) {
    sum += Number(body[index]) * factors[factorIndex % factors.length];
  }

  const expected = 11 - (sum % 11);
  return expected === 11 ? "0" : expected === 10 ? "K" : String(expected);
}

function uniqueRut(): string {
  const body = String(70_000_000 + (Date.now() % 9_000_000) + Math.floor(Math.random() * 900));
  return `${body}-${computeRutVerifier(body)}`;
}

test("createClientRecord persiste un cliente en MySQL y normaliza el RUT", async () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const email = `ana.${suffix}@smartpro.cl`;
  const rut = uniqueRut();
  let clientId = "";

  try {
    const client = await createClientRecord({
      companyName: "SmartPro Studio",
      rut,
      contactFirstName: "Ana",
      contactLastName: "García",
      email,
      phone: "+56 9 1234 5678",
      address: "Av. Siempre Viva 123",
      commune: "Providencia",
      city: "Santiago",
      region: "Metropolitana",
      website: "https://smartpro.cl",
      notes: "Cliente importante",
      status: "ACTIVO",
    });

    clientId = client.id;
    assert.equal(client.companyName, "SmartPro Studio");
    assert.equal(client.contactFirstName, "Ana");
    assert.equal(client.contactLastName, "García");
    assert.equal(client.rut, rut);
    assert.equal(client.email, email);
    assert.equal(client.phone, "+56 9 1234 5678");

    const stored = await getClientById(client.id);
    assert.ok(stored);
    assert.equal(stored?.email, email);

    const clients = await listClients();
    assert.ok(clients.some((item) => item.id === client.id));
  } finally {
    if (clientId) {
      await deleteClientRecord(clientId);
    }
  }
});

test("updateClientRecord y updateClientStatus persisten cambios reales", async () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const email = `sofia.${suffix}@smartpro.cl`;
  let clientId = "";

  try {
    const client = await createClientRecord({
      companyName: "Notas SmartPro SpA",
      rut: uniqueRut(),
      contactFirstName: "Sofía",
      contactLastName: "Rojas",
      email,
    });
    clientId = client.id;

    const updated = await updateClientRecord(client.id, {
      companyName: "Notas SmartPro Actualizada",
      city: "Valparaíso",
    });
    assert.equal(updated.companyName, "Notas SmartPro Actualizada");
    assert.equal(updated.city, "Valparaíso");

    const statusUpdated = await updateClientStatus(client.id, "POTENCIAL");
    assert.equal(statusUpdated.status, "POTENCIAL");

    const stored = await getClientById(client.id);
    assert.equal(stored?.companyName, "Notas SmartPro Actualizada");
    assert.equal(stored?.status, "POTENCIAL");
  } finally {
    if (clientId) {
      await deleteClientRecord(clientId);
    }
  }
});

test("createClientNote asocia y permite recuperar una nota del cliente", async () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  let clientId = "";

  try {
    const client = await createClientRecord({
      companyName: "Notas SmartPro SpA",
      rut: uniqueRut(),
      contactFirstName: "Sofía",
      contactLastName: "Rojas",
      email: `notas.${suffix}@smartpro.cl`,
    });
    clientId = client.id;

    const note = await createClientNote(
      client.id,
      { title: "Seguimiento", content: "Enviar propuesta actualizada el viernes." },
      "ejecutivo@smartpro.cl",
    );

    const notes = await listClientNotes(client.id);
    assert.equal(notes.length, 1);
    assert.deepEqual(notes[0], note);
    assert.equal(note.executiveEmail, "ejecutivo@smartpro.cl");
    assert.ok(note.createdAt);
  } finally {
    if (clientId) {
      await deleteClientRecord(clientId);
    }
  }
});
