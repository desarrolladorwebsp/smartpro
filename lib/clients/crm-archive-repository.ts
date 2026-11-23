import { prisma } from "../db";
import { crmToday, type CrmArchiveState } from "./crm-archive";

function database() {
  if (!prisma) throw new Error("No hay conexión a la base de datos.");
  return prisma;
}

export async function archiveCrmClient(
  kind: "business" | "person", id: string, crmArchiveState: CrmArchiveState, crmReactivateOn: Date | null,
) {
  const db = database();
  const data = { crmArchiveState, crmReactivateOn };
  const result = kind === "business"
    ? await db.business.updateMany({ where: { id, deletedAt: null, crmArchiveState: null }, data })
    : await db.client.updateMany({ where: { id, businessId: null, deletedAt: null, crmArchiveState: null }, data });
  return result.count === 1;
}

export async function reactivatePausedCrmClients(now = new Date()) {
  const db = database();
  const where = { deletedAt: null, crmArchiveState: "PAUSED" as const, crmReactivateOn: { lte: new Date(crmToday(now) + "T00:00:00Z") } };
  const data = { crmArchiveState: null, crmReactivateOn: null };
  const [accounts, contacts] = await db.$transaction([
    db.business.updateMany({ where, data }),
    db.client.updateMany({ where: { ...where, businessId: null }, data }),
  ]);
  return accounts.count + contacts.count;
}
