import { recordCrmChange } from "./crm-history";
import type { ManualCrmArchiveState } from "./crm-archive";
import { Prisma } from "@prisma/client";

import { prisma } from "../db";
import { linkImportedContact } from "./account-repository";
import { associateLegacyHistory, parseBusinessCreation, saveBusiness } from "./business-repository";
import { normalizeBusinessRut } from "./business";
import { notifyClientCreated } from "../notifications/events";
import { CLIENT_ORIGINS, type ClientOrigin, type QuoteMotive } from "./contact-options";
import { emptyClientInterest, formatClientInterestLabel, resolveClientInterest } from "./interest";
import { parseClientServiceInterests } from "./service-interests";
import { getCatalogTree } from "../services/repository";
import { type ClientCommercialStatus, type ClientRecord, type ClientStatus } from "./types";
import { visibleClientWhere } from "./visibility";

export {
  getAssignedExecutiveName,
  getClientCommercialStatusLabel,
  getClientStatusLabel,
  parseAssignedExecutiveId,
  parseClientCommercialStatus,
  type ClientAssignedExecutive,
  type ClientCommercialStatus,
  type ClientRecord,
  type ClientStatus,
} from "./types";

export type ClientPayload = {
  companyName?: string;
  businessName?: string;
  businessId?: string | null;
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
  interestServiceId?: string | null;
  interestSubcategoryId?: string | null;
  interestPlanId?: string | null;
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

export type InitialContactPayload = Omit<InitialContactRecord, "id" | "clientId" | "createdAt" | "executiveEmail" | "type"> & {
  interestServiceId?: string | null;
  interestSubcategoryId?: string | null;
  interestPlanId?: string | null;
};

export type ClientNoteRecord = {
  id: string;
  clientId: string | null;
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
  businessId?: string | null;
  business?: { name: string } | null;
  commercialContact?: { contact: { id: string; firstName: string; lastName: string; email: string; phone: string; jobTitle: string } } | null;
  crmStage?: ClientRecord["crmStage"];
  crmArchiveState?: ClientRecord["crmArchiveState"];
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
  commercialStatus: ClientCommercialStatus;
  assignedExecutiveId: string | null;
  assignedExecutive?: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
  } | null;
  interestServiceId: string | null;
  serviceInterests?: Prisma.JsonValue;
  interestServiceName: string;
  interestSubcategoryId: string | null;
  interestSubcategoryName: string;
  interestPlanId: string | null;
  interestPlanName: string;
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

function isPrismaUniqueError(error: unknown, field: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target) &&
    error.meta.target.includes(field)
  );
}

const ASSIGNED_EXECUTIVE_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

const CLIENT_RELATIONS = {
  assignedExecutive: { select: ASSIGNED_EXECUTIVE_SELECT },
  business: { select: { name: true } },
  commercialContact: { include: { contact: true } },
} as const;

function toAssignedExecutive(
  executive:
    | {
        id: string;
        firstName: string;
        lastName: string | null;
        email: string;
      }
    | null
    | undefined,
) {
  if (!executive) return null;

  return {
    id: executive.id,
    firstName: executive.firstName,
    lastName: executive.lastName ?? "",
    email: executive.email,
  };
}

function toClientRecord(client: ClientRow): ClientRecord {
  return {
    id: client.id,
    companyName: client.companyName,
    rut: client.rut,
    contactFirstName: client.commercialContact?.contact.firstName ?? client.contactFirstName,
    contactLastName: client.commercialContact?.contact.lastName ?? client.contactLastName,
    email: client.commercialContact?.contact.email ?? client.email,
    phone: client.commercialContact?.contact.phone ?? client.phone,
    contactId: client.commercialContact?.contact.id,
    jobTitle: client.commercialContact?.contact.jobTitle,
    address: client.address,
    commune: client.commune,
    city: client.city,
    region: client.region,
    website: client.website,
    notes: client.notes,
    status: client.status,
    commercialStatus: client.commercialStatus,
    crmStage: client.crmStage,
    crmArchiveState: client.crmArchiveState,
    businessId: client.businessId,
    businessName: client.business?.name,
    assignedExecutiveId: client.assignedExecutiveId,
    assignedExecutive: toAssignedExecutive(client.assignedExecutive),
    interestServiceId: client.interestServiceId ?? null,
    serviceInterests: parseClientServiceInterests(client.serviceInterests),
    interestServiceName: client.interestServiceName ?? "",
    interestSubcategoryId: client.interestSubcategoryId ?? null,
    interestSubcategoryName: client.interestSubcategoryName ?? "",
    interestPlanId: client.interestPlanId ?? null,
    interestPlanName: client.interestPlanName ?? "",
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
  };
}

function toNoteRecord(note: {
  id: string;
  clientId: string | null;
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
    commercialStatus: "PROSPECTO",
    assignedExecutiveId: null,
    assignedExecutive: null,
    interestServiceId: input.interestServiceId ?? null,
    interestServiceName: "",
    interestSubcategoryId: input.interestSubcategoryId ?? null,
    interestSubcategoryName: "",
    interestPlanId: input.interestPlanId ?? null,
    interestPlanName: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function resolveInterestForPayload(input: ClientPayload) {
  const hasInterestInput =
    input.interestServiceId !== undefined ||
    input.interestSubcategoryId !== undefined ||
    input.interestPlanId !== undefined;

  if (!hasInterestInput) {
    return null;
  }

  return resolveClientInterest(await getCatalogTree(), {
    interestServiceId: input.interestServiceId,
    interestSubcategoryId: input.interestSubcategoryId,
    interestPlanId: input.interestPlanId,
  });
}

function interestWriteData(interest: ReturnType<typeof emptyClientInterest>) {
  return {
    interestServiceId: interest.interestServiceId,
    interestServiceName: interest.interestServiceName,
    interestSubcategoryId: interest.interestSubcategoryId,
    interestSubcategoryName: interest.interestSubcategoryName,
    interestPlanId: interest.interestPlanId,
    interestPlanName: interest.interestPlanName,
  };
}

function compactClientPayload(input: ClientPayload): ClientPayload {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as ClientPayload;
}

function validateClientPayload(normalized: ClientRecord) {
  if (!normalized.contactFirstName || !normalized.contactLastName) {
    throw new Error("Nombre y apellido del contacto son obligatorios.");
  }

  if (normalized.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) {
    throw new Error("El email no tiene un formato válido.");
  }
}

export async function listClients(filters: { businessId?: string } = {}): Promise<ClientRecord[]> {
  const clients = await getPrisma().client.findMany({
    where: { ...filters, ...visibleClientWhere },
    include: CLIENT_RELATIONS,
    orderBy: { createdAt: "desc" },
  });

  return clients.map(toClientRecord);
}

export async function getClientById(id: string, { visibleOnly = false } = {}): Promise<ClientRecord | null> {
  const client = await getPrisma().client.findUnique({
    where: { ...(visibleOnly ? visibleClientWhere : {}), id },
    include: CLIENT_RELATIONS,
  });
  return client ? toClientRecord(client) : null;
}

export async function listClientNotes(clientId: string, businessId?: string, take?: number): Promise<ClientNoteRecord[]> {
  const notes = await getPrisma().clientNote.findMany({
    where: businessId ? { OR: [{ accountId: businessId }, { client: { businessId } }] } : { clientId },
    orderBy: { createdAt: "desc" },
    take,
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

  const client = await getPrisma().client.findFirst({
    where: { rut: normalized },
    include: CLIENT_RELATIONS,
  });
  return client ? toClientRecord(client) : null;
}

export async function findClientByEmail(email: string): Promise<ClientRecord | null> {
  const normalized = normalizeEmail(email ?? "");

  if (!normalized) {
    return null;
  }

  const client = await getPrisma().client.findFirst({
    where: { email: normalized },
    include: CLIENT_RELATIONS,
  });
  return client ? toClientRecord(client) : null;
}

async function resolveBusinessId(value: unknown): Promise<string | null | undefined> {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string" || !(await getPrisma().business.findUnique({ where: { id: value }, select: { id: true } }))) {
    throw new Error("El negocio seleccionado no existe.");
  }
  return value;
}

function clientWriteData(normalized: ClientRecord) {
  return {
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
  };
}

export async function createBusinessWithContacts(input: { name?: unknown; rut?: unknown; address?: unknown; contacts?: unknown }) {
  if (input.contacts === undefined || (Array.isArray(input.contacts) && input.contacts.length === 0)) {
    return { business: await saveBusiness(input), contacts: [] };
  }
  if (!Array.isArray(input.contacts)) throw new Error("Revisa los contactos de la empresa.");
  const data = parseBusinessCreation(input);
  const contacts = input.contacts.map((entry: unknown) => {
    if (!entry || typeof entry !== "object") throw new Error("Revisa los contactos de la empresa.");
    const contact = entry as Record<string, unknown>;
    const value = (key: string) => typeof contact[key] === "string" ? contact[key] as string : "";
    const normalized = normalizeClientPayload({
      contactFirstName: value("firstName"),
      contactLastName: value("lastName"),
      email: value("email"),
      phone: value("phone"),
    });
    validateClientPayload(normalized);
    return normalized;
  });
  const emails = contacts.map(({ email }) => email).filter(Boolean);
  if (new Set(emails).size !== emails.length) throw new Error("Hay contactos con el mismo correo.");
  const db = getPrisma();
  if (emails.length && await db.client.findFirst({ where: { email: { in: emails } }, select: { id: true } })) {
    throw new Error("Uno de los correos ya está registrado en otra ficha.");
  }

  try {
    const { clients, ...business } = await db.$transaction(async (tx) => {
      const created = await tx.business.create({
        data: { ...data, clients: { create: contacts.map(clientWriteData) } },
        include: { clients: true },
      });
      for (const legacy of created.clients) await linkImportedContact(tx, legacy);
      return tx.business.findUniqueOrThrow({ where: { id: created.id }, include: { clients: { include: CLIENT_RELATIONS } } });
    });
    const records = clients.map(toClientRecord);
    await Promise.all(records.map(notifyClientCreated));
    return { business, contacts: records };
  } catch (error) {
    if (isPrismaUniqueError(error, "rut")) throw new Error("Ya existe una empresa con ese RUT.");
    throw error;
  }
}

export async function createClientRecord(input: ClientPayload): Promise<ClientRecord> {
  const normalized = normalizeClientPayload(input);
  validateClientPayload(normalized);
  const interest = (await resolveInterestForPayload(input)) ?? emptyClientInterest();
  const businessId = await resolveBusinessId(input.businessId);

  if (normalized.email && (await findClientByEmail(normalized.email))) {
    throw new Error("El email ya está registrado para otro cliente.");
  }

  if (normalized.rut && (await findClientByRut(normalized.rut))) {
    throw new Error("El RUT ya está registrado.");
  }

  try {
    const created = await getPrisma().$transaction(async (tx) => {
      const legacy = await tx.client.create({ data: { ...clientWriteData(normalized), businessId, ...interestWriteData(interest) } });
      await linkImportedContact(tx, legacy);
      return tx.client.findUniqueOrThrow({ where: { id: legacy.id }, include: CLIENT_RELATIONS });
    });

    const record = toClientRecord(created);
    await notifyClientCreated(record);
    return record;
  } catch (error) {
    if (isPrismaUniqueError(error, "rut")) {
      throw new Error("El RUT ya está registrado.");
    }

    throw error;
  }
}

export async function updateClientRecord(id: string, input: ClientPayload, actorEmail?: string): Promise<ClientRecord> {
  const existing = await getClientById(id);

  if (!existing) {
    throw new Error("El cliente no existe.");
  }

  const normalized = normalizeClientPayload({
    ...existing,
    ...compactClientPayload(input),
  });
  validateClientPayload(normalized);

  const duplicateRut = normalized.rut && normalized.rut !== normalizeRut(existing.rut)
    ? await findClientByRut(normalized.rut)
    : null;
  if (duplicateRut && duplicateRut.id !== id) {
    throw new Error("El RUT ya está registrado.");
  }

  const duplicateEmail = await findClientByEmail(normalized.email);
  if (duplicateEmail && duplicateEmail.id !== id) {
    throw new Error("El email ya está registrado para otro cliente.");
  }

  const interest = await resolveInterestForPayload(input);
  const businessId = await resolveBusinessId(input.businessId);

  try {
    const updated = await getPrisma().$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM Client WHERE id = ${id} FOR UPDATE`;
      const previous = await tx.client.findUniqueOrThrow({ where: { ...visibleClientWhere, id }, select: { status: true } });
      const client = await tx.client.update({
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
          ...(businessId === undefined ? {} : { businessId }),
          ...(interest ? interestWriteData(interest) : {}),
        },
        include: CLIENT_RELATIONS,
      });
      if (actorEmail) await recordCrmChange(tx, {
        clientId: id, accountId: client.businessId, event: "CLASSIFICATION",
        fromState: previous.status, toState: client.status, actorEmail,
      });
      if (client.commercialContact) {
        if (businessId !== undefined && businessId !== client.commercialContact.accountId) {
          throw new Error("Gestiona los contactos desde la ficha del cliente.");
        }
        await tx.contact.update({
          where: { id: client.commercialContact.contact.id },
          data: { firstName: normalized.contactFirstName, lastName: normalized.contactLastName, phone: normalized.phone, email: normalized.email },
        });
      }
      if (businessId && !existing.businessId) {
        const business = await tx.business.findUnique({ where: { id: businessId }, select: { rut: true } });
        if (business && normalizeBusinessRut(existing.rut) === business.rut) {
          await associateLegacyHistory(tx, businessId, [id]);
        }
      }
      return tx.client.findUniqueOrThrow({ where: { id }, include: CLIENT_RELATIONS });
    });

    return toClientRecord(updated);
  } catch (error) {
    if (isPrismaUniqueError(error, "rut")) {
      throw new Error("El RUT ya está registrado.");
    }

    throw error;
  }
}

export async function updateClientStatus(id: string, status: ClientStatus, actorEmail?: string): Promise<ClientRecord> {
  return getPrisma().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM Client WHERE id = ${id} FOR UPDATE`;
    const current = await tx.client.findUnique({ where: { ...visibleClientWhere, id }, include: CLIENT_RELATIONS });
    if (!current) throw new Error("El cliente no existe.");
    if (current.status === status) return toClientRecord(current);
    const updated = await tx.client.update({ where: { id }, data: { status }, include: CLIENT_RELATIONS });
    if (actorEmail) await recordCrmChange(tx, {
      clientId: id, accountId: current.businessId, event: "CLASSIFICATION",
      fromState: current.status, toState: status, actorEmail,
    });
    return toClientRecord(updated);
  });
}

export async function updateClientCrmStage(id: string, crmStage: NonNullable<ClientRecord["crmStage"]>, actorEmail: string, reactivateFrom: ManualCrmArchiveState | null = null): Promise<boolean> {
  return getPrisma().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM Client WHERE id = ${id} FOR UPDATE`;
    const current = await tx.client.findUnique({ where: { ...visibleClientWhere, id } });
    if (!current || current.crmArchiveState !== reactivateFrom || (reactivateFrom && current.businessId)) return false;
    if (!reactivateFrom && current.crmStage === crmStage) return true;
    await tx.client.update({ where: { id }, data: {
      crmStage,
      ...(reactivateFrom ? { crmArchiveState: null, crmReactivateOn: null } : {}),
    } });
    await recordCrmChange(tx, {
      clientId: id, accountId: current.businessId, event: reactivateFrom ? "REACTIVATION" : "STAGE",
      fromState: current.crmArchiveState ?? current.crmStage, toState: crmStage, actorEmail,
    });
    return true;
  });
}

export async function updateClientCommercialStatus(
  id: string,
  commercialStatus: ClientCommercialStatus,
): Promise<ClientRecord> {
  const current = await getClientById(id);

  if (!current) {
    throw new Error("El cliente no existe.");
  }

  const updated = await getPrisma().client.update({
    where: { id },
    data: { commercialStatus },
    include: CLIENT_RELATIONS,
  });

  return toClientRecord(updated);
}

export async function assignClientExecutive(id: string, executiveId: string | null): Promise<ClientRecord> {
  const current = await getClientById(id);

  if (!current) {
    throw new Error("El cliente no existe.");
  }

  if (executiveId && current.assignedExecutiveId === executiveId) {
    return current;
  }

  if (executiveId) {
    const executive = await getPrisma().user.findFirst({
      where: {
        id: executiveId,
        role: { in: ["EXECUTIVE", "ADMIN"] },
        status: "ACTIVE",
      },
      select: ASSIGNED_EXECUTIVE_SELECT,
    });

    if (!executive) {
      throw new Error("El ejecutivo no está disponible para asignar.");
    }
  }

  const updated = await getPrisma().client.update({
    where: { id },
    data: { assignedExecutiveId: executiveId },
    include: CLIENT_RELATIONS,
  });

  return toClientRecord(updated);
}

function noteData(input: ClientNotePayload, executiveEmail: string) {
  const content = input.content?.trim() ?? "";
  if (!content) throw new Error("El contenido de la nota es obligatorio.");
  return {
    title: normalizeText(input.title ?? ""),
    content,
    executiveEmail: normalizeEmail(executiveEmail),
  };
}

export async function createAccountNote(accountId: string, input: ClientNotePayload, executiveEmail: string) {
  return toNoteRecord(await getPrisma().clientNote.create({
    data: { accountId, ...noteData(input, executiveEmail) },
  }));
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

  const note = await getPrisma().clientNote.create({
    data: { clientId, ...noteData({ ...input, content: normalizeText(input.content ?? "") }, executiveEmail) },
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
  const firstName = normalizeText(input.firstName ?? "");
  const lastName = normalizeText(input.lastName ?? "");
  const companyName = client.businessName ?? normalizeText(input.companyName ?? "");
  const email = normalizeEmail(input.email ?? "");
  const interest = await resolveInterestForPayload(input);
  const quoteMotive = formatClientInterestLabel(interest ?? emptyClientInterest()) || normalizeText(input.quoteMotive ?? "");

  if (!CLIENT_ORIGINS.includes(origin)) {
    throw new Error("Selecciona un origen válido.");
  }

  if (!firstName || !lastName) {
    throw new Error("Completa el nombre y apellido del contacto.");
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
    getPrisma().contact.updateMany({
      where: { clients: { some: { legacyClientId: clientId } } },
      data: { firstName, lastName, email, phone },
    }),
    getPrisma().client.update({
      where: { id: clientId },
      data: {
        ...(client.businessId ? {} : { companyName }),
        contactFirstName: firstName,
        contactLastName: lastName,
        email,
        phone,
        website,
        status: client.status === "INACTIVO" ? "POTENCIAL" : client.status,
        ...(interest ? interestWriteData(interest) : {}),
      },
    }),
  ]);

  return toInitialContactRecord(contact);
}

export async function deleteClientRecord(id: string): Promise<void> {
  await getPrisma().$transaction(async (tx) => {
    const link = await tx.clientContact.findUnique({ where: { legacyClientId: id } });
    await tx.client.delete({ where: { id } });
    if (!link) return;
    await tx.contact.deleteMany({ where: { id: link.contactId, clients: { none: {} } } });
    await tx.business.deleteMany({
      where: { id: `cliente-${id}`, contacts: { none: {} }, clients: { none: {} }, quotes: { none: {} }, sales: { none: {} } },
    });
  });
}
