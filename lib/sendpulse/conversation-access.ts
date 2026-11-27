import { prisma } from "@/lib/db";
import type { AdminSessionRole } from "@/lib/auth";

export async function listSendpulseConversations(accountId: string, session: { id: string; role: AdminSessionRole }, externalId?: string) {
  if (!prisma) throw new Error("Base de datos no disponible.");
  return prisma.sendpulseContact.findMany({
    where: {
      externalId,
      client: {
        businessId: accountId,
        deletedAt: null,
        business: { is: { deletedAt: null } },
        ...(session.role === "ADMIN" ? {} : {
          OR: [{ assignedExecutiveId: session.id }, { business: { is: { responsibleId: session.id } } }],
        }),
      },
    },
    select: { externalId: true, client: { select: { contactFirstName: true, contactLastName: true } } },
    orderBy: [{ clientId: "asc" }, { externalId: "asc" }],
  });
}
