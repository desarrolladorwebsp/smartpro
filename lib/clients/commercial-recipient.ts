import { prisma } from "../db";
import { parseBusinessRecipient } from "./business";
import { getBusiness } from "./business-repository";
import { commercialClientId, snapshotContact } from "./commercial-clients";
import { getClientById } from "./repository";

export async function resolveCommercialRecipient(contactId: string, accountId?: string) {
  const client = await getClientById(contactId);
  if (!client) throw new Error("El contacto no existe.");
  if (accountId !== undefined && commercialClientId(client.id, client.businessId) !== accountId) {
    throw new Error("Selecciona un contacto que pertenezca al cliente.");
  }
  if (accountId !== undefined && client.contactId && client.businessId) {
    const link = await prisma?.clientContact.findUnique({ where: { legacyClientId: client.id } });
    if (!link || link.accountId !== client.businessId || !client.contactFirstName || !client.contactLastName || !client.phone) {
      throw new Error("Completa el nombre, apellido y teléfono del contacto en la ficha del cliente.");
    }
  }
  const business = parseBusinessRecipient(await getBusiness(client.businessId));
  return {
    client,
    business,
    contactSnapshot: snapshotContact(client, accountId === undefined),
  };
}
