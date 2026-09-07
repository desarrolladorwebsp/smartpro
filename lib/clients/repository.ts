import { Prisma } from "@prisma/client";

import { prisma } from "../db";
import { CLIENT_ORIGINS, QUOTE_MOTIVES, type ClientOrigin, type QuoteMotive } from "./contact-options";
import { type ClientRecord, type ClientStatus } from "./types";

export { getClientStatusLabel, type ClientRecord, type ClientStatus } from "./types";

export type ClientPayload = {
  companyName?: string;
  businessName?: string;
  rut?: string;
  contactFirstName?: string;
  firstName?: string;
  contactLastName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  commune?: string;
  city?: string;
  region?: string;
  website?: string;
  notes?: string;
  status?: ClientStatus;
};

export type InitialContactRecord = {
  id: string;
  clientId: string;
  createdAt: string;
  executiveEmail: string;
  type: "CONTACTO_INICIAL";
  origin: ClientOrigin;
  quoteMotive: QuoteMotive;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  companyName: string;
  website: string;
  socialMedia: string;
  observation: string;
};

export type InitialContactPayload = Omit<InitialContactRecord, "id" | "clientId" | "createdAt" | "executiveEmail" | "type">;

export type ClientNoteRecord = {
  id: string;
  clientId: string;
  title: string;
  content: string;
  createdAt: string;
  executiveEmail: string;
};

export type ClientNotePayload = {
  title?: string;
  content?: string;
};

type ClientRow = {
  id: string;
  companyName: string;
  rut: string;
  contactFirstName: string;
  contactLastName: string;
  email: string;
  phone: string;
  address: string;
  commune: string;
  city: string;
  region: string;
  website: string;
  notes: string;
  status: ClientStatus;
  createdAt: Date;
  updatedAt: Date;
};

function getPrisma() {
  if (!prisma) {
    throw new Error("No hay conexión a la base de datos.");
  }

  return prisma;
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeRut(value: string): string {
  const digits = value.replace(/[^0-9kK]/g, "");

  if (!digits) {
    return "";
  }

  const body = digits.slice(0, -1);
  const verifier = digits.slice(-1).toUpperCase();

  if (!body || !verifier) {
    return "";
  }

  return `${body}-${verifier}`;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isValidRut(value: string): boolean {
  const normalized = normalizeRut(value).replace(/\s+/g, "");
  if (!/^\d{7,8}-?[0-9Kk]$/.test(normalized)) {
    return false;
  }

  const digits = normalized.replace("-", "");
  const body = digits.slice(0, -1);
  const verifier = digits.slice(-1).toUpperCase();
  const factors = [3, 2, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let index = body.length - 1, factorIndex = 0; index >= 0; index -= 1, factorIndex += 1) {
    sum += Number(body[index]) * factors[factorIndex % factors.length];
  }

  const expected = 11 - (sum % 11);
  const actual = expected === 11 ? "0" : expected === 10 ? "K" : String(expected);

  return actual === verifier;
}

function isPrismaUniqueError(error: unknown, field: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target) &&
    error.meta.target.includes(field)
  );
}

function toClientRecord(client: ClientRow): ClientRecord {
  return {
    id: client.id,
    companyName: client.companyName,
    rut: client.rut,
    contactFirstName: client.contactFirstName,
    contactLastName: client.contactLastName,
    email: client.email,
    phone: client.phone,
    address: client.address,
    commune: client.commune,
    city: client.city,
    region: client.region,
    website: client.website,
    notes: client.notes,
    status: client.status,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
  };
}

function toNoteRecord(note: {
  id: string;
  clientId: string;
  title: string;
  content: string;
  executiveEmail: string;
  createdAt: Date;
}): ClientNoteRecord {
  return {
    id: note.id,
    clientId: note.clientId,
    title: note.title,
    content: note.content,
    executiveEmail: note.executiveEmail,
    createdAt: note.createdAt.toISOString(),
  };
}

function toInitialContactRecord(contact: {
  id: string;
  clientId: string;
  createdAt: Date;
  executiveEmail: string;
  type: string;
  origin: string;
  quoteMotive: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  companyName: string;
  website: string;
  socialMedia: string;
  observation: string;
}): InitialContactRecord {
  return {
    id: contact.id,
    clientId: contact.clientId,
    createdAt: contact.createdAt.toISOString(),
    executiveEmail: contact.executiveEmail,
    type: "CONTACTO_INICIAL",
    origin: contact.origin as ClientOrigin,
    quoteMotive: contact.quoteMotive as QuoteMotive,
    firstName: contact.firstName,
    lastName: contact.lastName,
    phone: contact.phone,
    email: contact.email,
    companyName: contact.companyName,
    website: contact.website,
    socialMedia: contact.socialMedia,
    observation: contact.observation,
  };
}

function normalizeClientPayload(input: ClientPayload): ClientRecord {
  const companyName = normalizeText(input.companyName ?? input.businessName ?? "");
  const contactFirstName = normalizeText(input.contactFirstName ?? input.firstName ?? "");
  const contactLastName = normalizeText(input.contactLastName ?? input.lastName ?? "");
  const email = normalizeEmail(input.email ?? "");
  const rut = normalizeRut(input.rut ?? "");

  return {
    id: "",
    companyName,
    rut,
    contactFirstName,
    contactLastName,
    email,
    phone: normalizeText(input.phone ?? ""),
    address: normalizeText(input.address ?? ""),
    commune: normalizeText(input.commune ?? ""),
    city: normalizeText(input.city ?? ""),
    region: normalizeText(input.region ?? ""),
    website: normalizeText(input.website ?? "").replace(/^https?:\/\//i, ""),
    notes: normalizeText(input.notes ?? ""),
    status: input.status ?? "ACTIVO",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function validateClientPayload(normalized: ClientRecord) {
  if (!normalized.companyName) {
    throw new Error("La empresa es obligatoria.");
  }

  if (!normalized.rut || !isValidRut(normalized.rut)) {
    throw new Error("RUT inválido.");
  }

  if (!normalized.contactFirstName || !normalized.contactLastName) {
    throw new Error("Nombre y apellido del contacto son obligatorios.");
  }

  if (normalized.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) {
    throw new Error("El email no tiene un formato válido.");
  }
}

export async function listClients(): Promise<ClientRecord[]> {
  const clients = await getPrisma().client.findMany({
    orderBy: { createdAt: "desc" },
  });

  return clients.map(toClientRecord);
}

export async function getClientById(id: string): Promise<ClientRecord | null> {
  const client = await getPrisma().client.findUnique({ where: { id } });
  return client ? toClientRecord(client) : null;
}

export async function listClientNotes(clientId: string): Promise<ClientNoteRecord[]> {
  const notes = await getPrisma().clientNote.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
  });

  return notes.map(toNoteRecord);
}

export async function getInitialContactByClientId(clientId: string): Promise<InitialContactRecord | null> {
  const contact = await getPrisma().initialContact.findUnique({ where: { clientId } });
  return contact ? toInitialContactRecord(contact) : null;
}

export async function findClientByRut(rut: string): Promise<ClientRecord | null> {
  const normalized = normalizeRut(rut);

  if (!normalized) {
    return null;
  }

  const client = await getPrisma().client.findUnique({ where: { rut: normalized } });
  return client ? toClientRecord(client) : null;
}

export async function findClientByEmail(email: string): Promise<ClientRecord | null> {
  const normalized = normalizeEmail(email ?? "");

  if (!normalized) {
    return null;
  }

  const client = await getPrisma().client.findFirst({ where: { email: normalized } });
  return client ? toClientRecord(client) : null;
}

export async function createClientRecord(input: ClientPayload): Promise<ClientRecord> {
  const normalized = normalizeClientPayload(input);
  validateClientPayload(normalized);

  if (normalized.email && (await findClientByEmail(normalized.email))) {
    throw new Error("El email ya está registrado para otro cliente.");
  }

  if (await findClientByRut(normalized.rut)) {
    throw new Error("El RUT ya está registrado.");
  }

  try {
    const created = await getPrisma().client.create({
      data: {
        companyName: normalized.companyName,
        rut: normalized.rut,
        contactFirstName: normalized.contactFirstName,
        contactLastName: normalized.contactLastName,
        email: normalized.email,
        phone: normalized.phone,
        address: normalized.address,
        commune: normalized.commune,
        city: normalized.city,
        region: normalized.region,
        website: normalized.website,
        notes: normalized.notes,
        status: normalized.status,
      },
    });

    return toClientRecord(created);
  } catch (error) {
    if (isPrismaUniqueError(error, "rut")) {
      throw new Error("El RUT ya está registrado.");
    }

    throw error;
  }
}

export async function updateClientRecord(id: string, input: ClientPayload): Promise<ClientRecord> {
  const existing = await getClientById(id);

  if (!existing) {
    throw new Error("El cliente no existe.");
  }

  const normalized = normalizeClientPayload({
    ...existing,
    ...input,
  });
  validateClientPayload(normalized);

  const duplicateRut = await findClientByRut(normalized.rut);
  if (duplicateRut && duplicateRut.id !== id) {
    throw new Error("El RUT ya está registrado.");
  }

  const duplicateEmail = await findClientByEmail(normalized.email);
  if (duplicateEmail && duplicateEmail.id !== id) {
    throw new Error("El email ya está registrado para otro cliente.");
  }

  try {
    const updated = await getPrisma().client.update({
      where: { id },
      data: {
        companyName: normalized.companyName,
        rut: normalized.rut,
        contactFirstName: normalized.contactFirstName,
        contactLastName: normalized.contactLastName,
        email: normalized.email,
        phone: normalized.phone,
        address: normalized.address,
        commune: normalized.commune,
        city: normalized.city,
        region: normalized.region,
        website: normalized.website,
        notes: normalized.notes,
        status: normalized.status,
      },
    });

    return toClientRecord(updated);
  } catch (error) {
    if (isPrismaUniqueError(error, "rut")) {
      throw new Error("El RUT ya está registrado.");
    }

    throw error;
  }
}

export async function updateClientStatus(id: string, status: ClientStatus): Promise<ClientRecord> {
  const current = await getClientById(id);

  if (!current) {
    throw new Error("El cliente no existe.");
  }

  const updated = await getPrisma().client.update({
    where: { id },
    data: { status },
  });

  return toClientRecord(updated);
}

export async function createClientNote(
  clientId: string,
  input: ClientNotePayload,
  executiveEmail: string,
): Promise<ClientNoteRecord> {
  const client = await getClientById(clientId);

  if (!client) {
    throw new Error("El cliente no existe.");
  }

  const content = normalizeText(input.content ?? "");
  if (!content) {
    throw new Error("El contenido de la nota es obligatorio.");
  }

  const note = await getPrisma().clientNote.create({
    data: {
      clientId,
      title: normalizeText(input.title ?? ""),
      content,
      executiveEmail: normalizeEmail(executiveEmail),
    },
  });

  await getPrisma().client.update({
    where: { id: clientId },
    data: { updatedAt: new Date() },
  });

  return toNoteRecord(note);
}

export async function registerInitialContact(
  clientId: string,
  input: InitialContactPayload,
  executiveEmail: string,
): Promise<InitialContactRecord> {
  const client = await getClientById(clientId);

  if (!client) {
    throw new Error("El cliente no existe.");
  }

  const existingContact = await getPrisma().initialContact.findUnique({ where: { clientId } });
  if (existingContact) {
    throw new Error("Ya existe un contacto inicial registrado para este cliente.");
  }

  const origin = input.origin;
  const quoteMotive = input.quoteMotive;
  const firstName = normalizeText(input.firstName ?? "");
  const lastName = normalizeText(input.lastName ?? "");
  const companyName = normalizeText(input.companyName ?? "");
  const email = normalizeEmail(input.email ?? "");

  if (!CLIENT_ORIGINS.includes(origin)) {
    throw new Error("Selecciona un origen válido.");
  }

  if (!QUOTE_MOTIVES.includes(quoteMotive)) {
    throw new Error("Selecciona un motivo de cotización válido.");
  }

  if (!firstName || !lastName || !companyName) {
    throw new Error("Completa los datos obligatorios del contacto y la empresa.");
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("El email no tiene un formato válido.");
  }

  const website = normalizeText(input.website ?? "").replace(/^https?:\/\//i, "");
  const phone = normalizeText(input.phone ?? "");

  const [contact] = await getPrisma().$transaction([
    getPrisma().initialContact.create({
      data: {
        clientId,
        executiveEmail: normalizeEmail(executiveEmail),
        type: "CONTACTO_INICIAL",
        origin,
        quoteMotive,
        firstName,
        lastName,
        phone,
        email,
        companyName,
        website,
        socialMedia: normalizeText(input.socialMedia ?? ""),
        observation: normalizeText(input.observation ?? ""),
      },
    }),
    getPrisma().client.update({
      where: { id: clientId },
      data: {
        companyName,
        contactFirstName: firstName,
        contactLastName: lastName,
        email,
        phone,
        website,
        status: client.status === "INACTIVO" ? "POTENCIAL" : client.status,
      },
    }),
  ]);

  return toInitialContactRecord(contact);
}

export async function deleteClientRecord(id: string): Promise<void> {
  await getPrisma().client.delete({ where: { id } });
}
