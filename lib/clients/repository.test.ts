import test from "node:test";
import assert from "node:assert/strict";

import {
  assignClientExecutive,
  createClientNote,
  createClientRecord,
  deleteClientRecord,
  getClientById,
  listClientNotes,
  listClients,
  updateClientCommercialStatus,
  updateClientRecord,
  updateClientStatus,
} from "./repository";
import { listExecutives } from "../executives/repository";
import { getCatalogTree } from "../services/repository";

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
    assert.equal(client.commercialStatus, "PROSPECTO");
    assert.equal(client.assignedExecutiveId, null);

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

test("createClientRecord permite guardar un cliente sin RUT ni ubicación", async () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  let clientId = "";

  try {
    const client = await createClientRecord({
      companyName: "Cliente Sin Rut SpA",
      contactFirstName: "Laura",
      contactLastName: "Díaz",
      email: `laura.${suffix}@smartpro.cl`,
    });
    clientId = client.id;

    assert.equal(client.rut, "");
    assert.equal(client.address, "");
    assert.equal(client.commune, "");
    assert.equal(client.city, "");
    assert.equal(client.region, "");
  } finally {
    if (clientId) {
      await deleteClientRecord(clientId);
    }
  }
});

test("createClientRecord acepta un RUT sin validar dígito verificador", async () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  let clientId = "";

  try {
    const client = await createClientRecord({
      companyName: "Cliente Rut Libre SpA",
      rut: "12.345.678-9",
      contactFirstName: "Mario",
      contactLastName: "Soto",
      email: `mario.${suffix}@smartpro.cl`,
    });
    clientId = client.id;
    assert.equal(client.rut, "12345678-9");
  } finally {
    if (clientId) {
      await deleteClientRecord(clientId);
    }
  }
});

test("updateClientRecord conserva la ubicación si no se envía", async () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  let clientId = "";

  try {
    const client = await createClientRecord({
      companyName: "Ubicación SmartPro SpA",
      contactFirstName: "Elena",
      contactLastName: "Vargas",
      email: `elena.${suffix}@smartpro.cl`,
      address: "Av. Siempre Viva 123",
      commune: "Providencia",
      city: "Santiago",
      region: "Metropolitana",
    });
    clientId = client.id;

    const updated = await updateClientRecord(client.id, {
      companyName: "Ubicación SmartPro Actualizada",
    });

    assert.equal(updated.companyName, "Ubicación SmartPro Actualizada");
    assert.equal(updated.address, "Av. Siempre Viva 123");
    assert.equal(updated.commune, "Providencia");
    assert.equal(updated.city, "Santiago");
    assert.equal(updated.region, "Metropolitana");
  } finally {
    if (clientId) {
      await deleteClientRecord(clientId);
    }
  }
});

test("createClientNote persiste una nota asociada al cliente", async () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  let clientId = "";

  try {
    const client = await createClientRecord({
      companyName: "Notas SmartPro SpA",
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

test("createClientRecord asocia un servicio, categoría o plan del catálogo", async () => {
  const tree = await getCatalogTree();
  const service = tree.find((entry) => entry.subcategories.some((category) => category.plans.length > 0)) ?? tree[0];

  if (!service) {
    return;
  }

  const category = service.subcategories.find((entry) => entry.plans.length > 0) ?? service.subcategories[0];
  const plan = category?.plans[0];
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  let clientId = "";

  try {
    const client = await createClientRecord({
      companyName: "Interés SmartPro SpA",
      contactFirstName: "Paula",
      contactLastName: "Núñez",
      email: `paula.${suffix}@smartpro.cl`,
      interestServiceId: service.id,
      interestSubcategoryId: category?.id ?? null,
      interestPlanId: plan?.id ?? null,
    });
    clientId = client.id;

    assert.equal(client.interestServiceId, service.id);
    assert.equal(client.interestServiceName, service.name);
    if (category) {
      assert.equal(client.interestSubcategoryId, category.id);
      assert.equal(client.interestSubcategoryName, category.name);
    }
    if (plan) {
      assert.equal(client.interestPlanId, plan.id);
      assert.equal(client.interestPlanName, plan.name);
    }
  } finally {
    if (clientId) {
      await deleteClientRecord(clientId);
    }
  }
});

test("el estado comercial y el ejecutivo asignado se persisten en el cliente", async () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  let clientId = "";

  try {
    const client = await createClientRecord({
      companyName: "Asignación SmartPro SpA",
      contactFirstName: "Carla",
      contactLastName: "Muñoz",
      email: `carla.${suffix}@smartpro.cl`,
    });
    clientId = client.id;
    assert.equal(client.commercialStatus, "PROSPECTO");

    const updated = await updateClientCommercialStatus(client.id, "EN_SEGUIMIENTO");
    assert.equal(updated.commercialStatus, "EN_SEGUIMIENTO");

    const stored = await getClientById(client.id);
    assert.equal(stored?.commercialStatus, "EN_SEGUIMIENTO");

    const lost = await updateClientCommercialStatus(client.id, "CERRADO_PERDIDO");
    assert.equal(lost.commercialStatus, "CERRADO_PERDIDO");

    const executives = await listExecutives();
    const active = executives.find((entry) => entry.status === "ACTIVE");
    if (!active) {
      return;
    }

    const assigned = await assignClientExecutive(client.id, active.id);
    assert.equal(assigned.assignedExecutiveId, active.id);
    assert.equal(assigned.assignedExecutive?.email, active.email);

    const persisted = await getClientById(client.id);
    assert.equal(persisted?.assignedExecutiveId, active.id);

    const cleared = await assignClientExecutive(client.id, null);
    assert.equal(cleared.assignedExecutiveId, null);
    assert.equal(cleared.assignedExecutive, null);
  } finally {
    if (clientId) {
      await deleteClientRecord(clientId);
    }
  }
});
