import { prisma } from "@/lib/db";
import type { AdminSessionRole } from "@/lib/auth";
import { personName } from "@/lib/clients/commercial-clients";

type Session = { id: string; role: AdminSessionRole };
export type SendpulseConversationOption = { externalId: string; name: string };

export async function listSendpulseConversations(accountId: string, session: Session, externalId?: string) {
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

export async function listSendpulseConversationOptions(accountId: string, session: Session): Promise<SendpulseConversationOption[]> {
  const conversations = await listSendpulseConversations(accountId, session);
  return conversations.map(({ externalId, client }) => ({ externalId, name: personName(client) || "Contacto de SendPulse" }));
}
