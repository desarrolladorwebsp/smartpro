import { recordCrmChange } from "./crm-history";
import type { ManualCrmArchiveState } from "./crm-archive";
import { Prisma } from "@prisma/client";
import type { ClientCrmStage, ClientStatus } from "./types";
import { prisma } from "../db";
import { normalizeBusinessRut } from "./business";

function database() {
  if (!prisma) throw new Error("No hay conexión a la base de datos.");
  return prisma;
}

export async function getBusiness(id: string | null | undefined) {
  return id ? database().business.findUnique({ where: { id } }) : null;
}

export async function listBusinesses() {
  const businesses = await database().business.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    include: { responsible: { select: { id: true, firstName: true, lastName: true, email: true } } },
  });
  return businesses.map((business) => ({ ...business, rut: business.rut ?? "", responsible: business.responsible && { ...business.responsible, lastName: business.responsible.lastName ?? "" } }));
}

function businessDetails(input: { name?: unknown; address?: unknown }) {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const address = typeof input.address === "string" ? input.address.trim() : "";
  if (!name || name.length > 191 || address.length > 191) throw new Error("Revisa el nombre y la dirección del negocio.");
  return { name, address };
}

export function parseBusinessCreation(input: { name?: unknown; rut?: unknown; address?: unknown }) {
  const details = businessDetails(input);
  const rut = typeof input.rut === "string" ? normalizeBusinessRut(input.rut) : null;
  if (!rut) throw new Error("Ingresa un RUT de empresa válido.");
  return { ...details, rut };
}

export async function updateBusinessDetails(id: string, input: { name?: unknown; address?: unknown }) {
  return database().business.update({ where: { id }, data: businessDetails(input) });
}

export async function saveBusiness(input: { name?: unknown; rut?: unknown; address?: unknown }) {
  const { name, rut, address } = parseBusinessCreation(input);
  const business = await database().business.upsert({
    where: { rut },
    update: {},
    create: { name, rut, address },
  });
  if (business.name !== name || business.address !== address) throw new Error("Ya existe un negocio con ese RUT.");
  return business;
}

export async function updateBusinessCrm(id: string, status: ClientStatus, actorEmail: string) {
  return database().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM Business WHERE id = ${id} FOR UPDATE`;
    const current = await tx.business.findUnique({ where: { id, deletedAt: null }, select: { status: true } });
    if (!current) return false;
    if (current.status !== status) {
      await tx.business.update({ where: { id }, data: { status } });
      await recordCrmChange(tx, { accountId: id, event: "CLASSIFICATION", fromState: current.status, toState: status, actorEmail });
    }
    return true;
  });
}

export async function associateLegacyHistory(tx: Prisma.TransactionClient, businessId: string, clientIds: string[]) {
  const ids = Prisma.join(clientIds);
  await tx.$executeRaw`
    UPDATE Quote q SET businessId = ${businessId}
    WHERE q.clientId IN (${ids}) AND q.businessId IS NULL AND q.businessRecipient IS NULL
    AND (q.contactSnapshot IS NULL OR JSON_CONTAINS_PATH(q.contactSnapshot, 'one', '$.legacyCompanyName'))
  `;
  await tx.$executeRaw`
    UPDATE Sale s LEFT JOIN Quote q ON q.id = s.quoteId SET s.businessId = ${businessId}
    WHERE s.clientId IN (${ids}) AND s.businessId IS NULL AND s.businessRecipient IS NULL
    AND (s.quoteId IS NULL OR q.businessId = ${businessId})
    AND (s.contactSnapshot IS NULL OR JSON_CONTAINS_PATH(s.contactSnapshot, 'one', '$.legacyCompanyName'))
  `;
}

export async function associateConfirmedBusinessClients(businessId: string, clientIds: string[]) {
  const business = await getBusiness(businessId);
  if (!business) throw new Error("El negocio seleccionado no existe.");
  return database().$transaction(async (tx) => {
    const clients = await tx.client.findMany({
      where: { id: { in: clientIds }, businessId: null },
      select: { id: true, rut: true },
    });
    if (clients.length !== clientIds.length || clients.some((client) => normalizeBusinessRut(client.rut) !== business.rut)) {
      throw new Error("Solo puedes agrupar clientes sin negocio cuyo RUT coincide.");
    }
    const result = await tx.client.updateMany({
      where: { businessId: null, OR: clients.map(({ id, rut }) => ({ id, rut })) },
      data: { businessId },
    });
    if (result.count !== clients.length) throw new Error("Las fichas cambiaron. Actualiza el listado antes de agrupar.");
    await associateLegacyHistory(tx, businessId, clientIds);
    return result.count;
  });
}

export async function moveBusinessCard(id: string, crmStage: ClientCrmStage, actorEmail: string, anchor?: { id: string; after: boolean }, reactivateFrom: ManualCrmArchiveState | null = null) {
  return database().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM Business ORDER BY id FOR UPDATE`;
    const current = await tx.business.findUnique({ where: { id, deletedAt: null }, select: { crmStage: true, crmArchiveState: true } });
    if (!current || current.crmArchiveState !== reactivateFrom) return false;
    if (!reactivateFrom && !anchor && current.crmStage === crmStage) return true;
    if (reactivateFrom && !anchor) {
      await tx.business.update({ where: { id }, data: {
        crmStage, crmArchiveState: null, crmReactivateOn: null,
        ...(current.crmStage !== crmStage ? { crmPosition: null } : {}),
      } });
      await recordCrmChange(tx, {
        accountId: id, event: "REACTIVATION", fromState: reactivateFrom, toState: crmStage, actorEmail,
      });
      return true;
    }
    const cards = await tx.business.findMany({
      where: { crmStage, id: { not: id }, deletedAt: null, crmArchiveState: null },
      select: { id: true, crmPosition: true, name: true },
    });
    cards.sort((a, b) => (a.crmPosition ?? Infinity) - (b.crmPosition ?? Infinity) ||
      a.name.localeCompare(b.name, "es-CL") || a.id.localeCompare(b.id));
    const index = anchor ? cards.findIndex((card) => card.id === anchor.id) : cards.length;
    if (index < 0) throw new Error("La tarjeta de referencia cambió de columna.");
    const ids = cards.map((card) => card.id);
    ids.splice(index + (anchor?.after ? 1 : 0), 0, id);
    for (const [crmPosition, cardId] of ids.entries()) {
      await tx.business.update({ where: { id: cardId }, data: {
        crmStage, crmPosition,
        ...(reactivateFrom && cardId === id ? { crmArchiveState: null, crmReactivateOn: null } : {}),
      } });
    }
    await recordCrmChange(tx, {
      accountId: id, event: reactivateFrom ? "REACTIVATION" : "STAGE",
      fromState: current.crmArchiveState ?? current.crmStage, toState: crmStage, actorEmail,
    });
    return true;
  });
}

export async function assignBusinessResponsible(id: string, responsibleId: string | null) {
  return database().$transaction(async (tx) => {
    if (responsibleId && !await tx.user.findFirst({
      where: { id: responsibleId, role: { in: ["ADMIN", "EXECUTIVE"] }, status: "ACTIVE", deletedAt: null },
      select: { id: true },
    })) throw new Error("Selecciona un responsable activo.");
    return (await tx.business.updateMany({ where: { id }, data: { responsibleId } })).count > 0;
  });
}
