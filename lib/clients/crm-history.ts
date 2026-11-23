import type { Prisma } from "@prisma/client";
import { prisma } from "../db";

export function crmChangeNote(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function recordCrmChange(tx: Prisma.TransactionClient, input: {
  accountId?: string | null;
  clientId?: string | null;
  event: "STAGE" | "CLASSIFICATION" | "ARCHIVE" | "REACTIVATION" | "DELETION";
  fromState: string;
  toState: string;
  note?: string;
  actorEmail: string;
  reactivateOn?: Date | null;
}) {
  if (input.fromState === input.toState) return;
  if (!input.actorEmail.trim()) throw new Error("Falta identificar al ejecutivo.");
  await tx.clientCrmHistory.create({ data: { ...input, note: input.note ?? "" } });
}

export async function listCrmHistory(accountId: string | null, clientId?: string) {
  if (!accountId && !clientId) return [];
  if (!prisma) throw new Error("No hay conexión a la base de datos.");
  return prisma.clientCrmHistory.findMany({
    where: accountId ? { OR: [{ accountId }, { client: { businessId: accountId } }] } : { clientId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}
