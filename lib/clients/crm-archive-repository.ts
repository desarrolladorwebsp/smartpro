import { prisma } from "../db";
import { crmToday, parseReactivationDate, type CrmArchiveState } from "./crm-archive";
import { crmChangeNote, recordCrmChange } from "./crm-history";

function database() {
  if (!prisma) throw new Error("No hay conexión a la base de datos.");
  return prisma;
}

export async function archiveCrmClient(
  kind: "business" | "person", id: string, crmArchiveState: CrmArchiveState, crmReactivateOn: Date | null,
  note: string, actorEmail: string,
) {
  const content = crmChangeNote(note);
  if (!content || content.length > 10000) throw new Error("Escribe una nota de hasta 10.000 caracteres.");
  if (crmArchiveState === "PAUSED" && !parseReactivationDate(crmReactivateOn?.toISOString().slice(0, 10))) {
    throw new Error("Elige una fecha de reactivación posterior a hoy.");
  }
  return database().$transaction(async (tx) => {
    if (kind === "business") {
      await tx.$queryRaw`SELECT id FROM Business WHERE id = ${id} FOR UPDATE`;
    } else {
      await tx.$queryRaw`SELECT id FROM Client WHERE id = ${id} FOR UPDATE`;
    }
    const current = kind === "business"
      ? await tx.business.findUnique({ where: { id } })
      : await tx.client.findFirst({ where: { id, businessId: null } });
    if (!current || current.deletedAt || current.crmArchiveState) return false;
    const data = { crmArchiveState, crmReactivateOn: crmArchiveState === "PAUSED" ? crmReactivateOn : null };
    if (kind === "business") await tx.business.update({ where: { id }, data });
    else await tx.client.update({ where: { id }, data });
    const target = kind === "business" ? { accountId: id } : { clientId: id };
    await tx.clientNote.create({ data: {
      ...target, title: crmArchiveState === "PAUSED" ? "En pausa" : "Perdido",
      content, executiveEmail: actorEmail,
    } });
    await recordCrmChange(tx, {
      ...target, event: "ARCHIVE", fromState: current.crmStage, toState: crmArchiveState,
      note: content, actorEmail, reactivateOn: data.crmReactivateOn,
    });
    return true;
  });
}

export async function reactivatePausedCrmClients(now = new Date()) {
  const dueDate = crmToday(now);
  const where = { deletedAt: null, crmArchiveState: "PAUSED" as const, crmReactivateOn: { lte: new Date(dueDate + "T00:00:00Z") } };
  return database().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM Business WHERE deletedAt IS NULL AND crmArchiveState = 'PAUSED' AND crmReactivateOn <= ${dueDate} ORDER BY id FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM Client WHERE deletedAt IS NULL AND businessId IS NULL AND crmArchiveState = 'PAUSED' AND crmReactivateOn <= ${dueDate} ORDER BY id FOR UPDATE`;
    const accounts = await tx.business.findMany({ where });
    const contacts = await tx.client.findMany({ where: { ...where, businessId: null } });
    const data = { crmArchiveState: null, crmReactivateOn: null };
    for (const account of accounts) {
      await tx.business.update({ where: { id: account.id }, data });
      await recordCrmChange(tx, {
        accountId: account.id, event: "REACTIVATION", fromState: "PAUSED", toState: account.crmStage,
        actorEmail: "Sistema", note: "Reactivación automática en la fecha programada.", reactivateOn: account.crmReactivateOn,
      });
    }
    for (const contact of contacts) {
      await tx.client.update({ where: { id: contact.id }, data });
      await recordCrmChange(tx, {
        clientId: contact.id, event: "REACTIVATION", fromState: "PAUSED", toState: contact.crmStage,
        actorEmail: "Sistema", note: "Reactivación automática en la fecha programada.", reactivateOn: contact.crmReactivateOn,
      });
    }
    return accounts.length + contacts.length;
  });
}
