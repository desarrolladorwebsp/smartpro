import { recordCrmChange } from "./crm-history";
import { Prisma, type Client } from "@prisma/client";
import { prisma } from "../db";
import { normalizeBusinessRut } from "./business";
import { isClientStatus } from "./types";

function database() {
  if (!prisma) throw new Error("No hay conexión a la base de datos.");
  return prisma;
}

function text(value: unknown, max = 191) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function fields(input: unknown) {
  return input && typeof input === "object" ? input as Record<string, unknown> : {};
}

function accountData(input: unknown, existingRut?: string | null) {
  const form = fields(input);
  const name = text(form.name);
  const suppliedRut = text(form.rut);
  const rut = suppliedRut && suppliedRut === existingRut ? suppliedRut : normalizeBusinessRut(suppliedRut);
  if (!name) throw new Error("Ingresa el nombre del cliente.");
  if (suppliedRut && !rut) throw new Error("Ingresa un RUT válido o deja el campo vacío.");
  return {
    name, rut, website: text(form.website), address: text(form.address), notes: text(form.notes, 10000),
    status: isClientStatus(form.status) ? form.status : undefined,
  };
}

function contactData(input: unknown) {
  const form = fields(input);
  const firstName = text(form.firstName);
  const lastName = text(form.lastName);
  const phone = text(form.phone);
  const email = text(form.email).toLowerCase();
  if (!firstName || !lastName || !phone) throw new Error("Cada contacto necesita nombre, apellido y teléfono.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Revisa el correo del contacto.");
  return { firstName, lastName, phone, email, jobTitle: text(form.jobTitle) };
}

function legacyContactData(contact: ReturnType<typeof contactData>) {
  const { firstName, lastName, phone, email } = contact;
  return { contactFirstName: firstName, contactLastName: lastName, phone, email };
}

async function addAccountContact(tx: Prisma.TransactionClient, accountId: string, contact: ReturnType<typeof contactData>) {
  const bridge = await tx.client.create({ data: { businessId: accountId, companyName: "", ...legacyContactData(contact) } });
  const record = await tx.contact.create({ data: contact });
  await tx.clientContact.create({ data: { accountId, contactId: record.id, legacyClientId: bridge.id } });
  return { ...record, legacyClientId: bridge.id };
}

export async function createAccount(input: unknown) {
  const form = fields(input);
  const data = accountData(form);
  if (!Array.isArray(form.contacts) || form.contacts.length === 0) throw new Error("Agrega al menos un contacto.");
  const contacts = form.contacts.map(contactData);
  return database().$transaction(async (tx) => {
    const account = await tx.business.create({ data });
    for (const contact of contacts) await addAccountContact(tx, account.id, contact);
    return account;
  });
}

export async function hideCommercialClient(id: string, kind: "business" | "person", actorEmail: string) {
  return database().$transaction(async (tx) => {
    const where = { id, deletedAt: null };
    const data = { deletedAt: new Date() };
    const result = kind === "business"
      ? await tx.business.updateMany({ where, data })
      : await tx.client.updateMany({ where: { ...where, businessId: null }, data });
    if (result.count === 0) {
      const existing = kind === "business"
        ? await tx.business.findUnique({ where: { id }, select: { deletedAt: true } })
        : await tx.client.findUnique({ where: { id, businessId: null }, select: { deletedAt: true } });
      return Boolean(existing?.deletedAt);
    }

    await recordCrmChange(tx, {
      ...(kind === "business" ? { accountId: id } : { clientId: id }),
      event: "DELETION",
      fromState: "VISIBLE",
      toState: "DELETED",
      actorEmail,
    });
    return true;
  });
}

export async function updateAccount(id: string, input: unknown, actorEmail: string) {
  return database().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM Business WHERE id = ${id} FOR UPDATE`;
    const current = await tx.business.findUniqueOrThrow({ where: { id, deletedAt: null }, select: { rut: true, status: true } });
    const result = await tx.business.update({ where: { id }, data: accountData(input, current.rut) });
    await recordCrmChange(tx, { accountId: id, event: "CLASSIFICATION", fromState: current.status, toState: result.status, actorEmail });
    return result;
  });
}

export async function saveAccountContact(accountId: string, input: unknown) {
  const form = fields(input);
  const contact = contactData(form);
  if (typeof form.id !== "string" || !form.id) {
    return database().$transaction((tx) => addAccountContact(tx, accountId, contact));
  }
  const contactId = form.id;
  return database().$transaction(async (tx) => {
    const relation = await tx.clientContact.findUnique({
      where: { accountId_contactId: { accountId, contactId } },
    });
    if (!relation) throw new Error("El contacto no pertenece al cliente.");
    const updated = await tx.contact.update({ where: { id: contactId }, data: contact });
    await tx.client.updateMany({
      where: { commercialContact: { contactId } },
      data: legacyContactData(contact),
    });
    return { ...updated, legacyClientId: relation.legacyClientId };
  });
}

export function accountApiError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return { error: "Ya existe un cliente con ese RUT.", status: 409 };
    if (error.code === "P2025" || error.code === "P2003") return { error: "El cliente no existe.", status: 404 };
    console.error("[smartpro:clientes]", error.code);
    return { error: "No se pudo guardar el cambio.", status: 500 };
  }
  return { error: error instanceof Error ? error.message : "No se pudo guardar el cambio.", status: 400 };
}

export async function linkImportedContact(tx: Prisma.TransactionClient, client: Client) {
  const { contactFirstName, contactLastName, phone, email } = client;
  let accountId = client.businessId;
  if (!accountId) {
    const fullName = [contactFirstName, contactLastName].filter(Boolean).join(" ");
    const name = client.companyName && client.companyName !== contactFirstName ? client.companyName : fullName;
    const rut = normalizeBusinessRut(client.rut);
    const registeredRut = rut ? await tx.business.findUnique({ where: { rut }, select: { id: true } }) : null;
    const account = await tx.business.create({
      data: {
        id: `cliente-${client.id}`,
        name: name || "Cliente sin nombre",
        rut: registeredRut ? null : rut,
        address: [client.address, client.commune, client.city, client.region].filter(Boolean).join(", ").slice(0, 191),
        website: client.website,
        notes: client.notes,
        crmStage: client.crmStage,
        status: client.status,
      },
    });
    accountId = account.id;
    await tx.client.update({ where: { id: client.id }, data: { businessId: accountId } });
  }
  await tx.clientContact.create({
    data: {
      account: { connect: { id: accountId } },
      legacyClient: { connect: { id: client.id } },
      contact: { create: { firstName: contactFirstName, lastName: contactLastName, phone, email } },
    },
  });
}
