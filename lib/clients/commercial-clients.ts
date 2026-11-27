import type { BusinessProfile } from "./business";
import { CLIENT_SERVICE_INTEREST_KEYS, clientServiceInterestFromName, parseClientServiceInterests, type ClientServiceInterest } from "./service-interests";
import type { ClientAssignedExecutive, ClientCrmStage, ClientRecord, ClientStatus } from "./types";

export type CommercialClient = {
  id: string;
  kind: "business" | "person";
  name: string;
  rut: string;
  href: string;
  crmStage: ClientCrmStage;
  status: ClientStatus;
  contacts: ClientRecord[];
  serviceInterests: ClientServiceInterest[];
  crmPosition?: number | null;
  crmArchiveState?: ClientRecord["crmArchiveState"];
  responsible?: ClientAssignedExecutive | null;
  origin?: BusinessProfile["origin"];
  createdAt?: string | null;
};

export const personName = (contact: Pick<ClientRecord, "contactFirstName" | "contactLastName">) =>
  [contact.contactFirstName, contact.contactLastName].filter(Boolean).join(" ");

export function commercialClientId(clientId: string, businessId?: string | null) {
  return businessId ? `business:${businessId}` : `person:${clientId}`;
}

export function parseCommercialClientId(key: string) {
  const match = /^(business|person):([^:]+)$/.exec(key);
  if (!match) return null;
  return {
    kind: match[1] as CommercialClient["kind"],
    id: match[2],
  };
}

function contactServiceInterests(contact: ClientRecord): ClientServiceInterest[] {
  if (contact.serviceInterests) return contact.serviceInterests;
  const historical = clientServiceInterestFromName(contact.interestServiceName);
  return historical ? [historical] : [];
}

export function listCommercialClients(contacts: ClientRecord[], businesses: BusinessProfile[]): CommercialClient[] {
  const byBusiness = new Map<string, ClientRecord[]>();
  const individuals: CommercialClient[] = [];
  for (const contact of contacts) {
    if (contact.businessId) {
      const existing = byBusiness.get(contact.businessId);
      if (existing) existing.push(contact);
      else byBusiness.set(contact.businessId, [contact]);
      continue;
    }
    individuals.push({
      id: commercialClientId(contact.id),
      kind: "person",
      name: personName(contact),
      rut: contact.rut,
      href: `/dashboard/clientes/${contact.id}`,
      crmStage: contact.crmStage ?? "NEW",
      crmArchiveState: contact.crmArchiveState,
      status: contact.status,
      createdAt: contact.createdAt,
      contacts: [contact],
      serviceInterests: contactServiceInterests(contact),
    });
  }

  const companies: CommercialClient[] = businesses.map((business) => {
    const contacts = (byBusiness.get(business.id) ?? []).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
    const savedInterests = parseClientServiceInterests(business.serviceInterests);
    const serviceInterests = savedInterests ?? CLIENT_SERVICE_INTEREST_KEYS.filter((key) =>
      contacts.some((contact) => contactServiceInterests(contact).includes(key)),
    );
    return {
      id: commercialClientId("", business.id),
      kind: "business",
      name: business.name,
      rut: business.rut,
      href: `/dashboard/clientes/ficha/${business.id}`,
      crmStage: business.crmStage,
      crmArchiveState: business.crmArchiveState,
      status: business.status,
      crmPosition: business.crmPosition,
      responsible: business.responsible,
      origin: business.origin,
      createdAt: business.createdAt?.toISOString() ?? null,
      contacts,
      serviceInterests,
    };
  });
  return [...companies, ...individuals].sort((a, b) => a.name.localeCompare(b.name, "es-CL"));
}

export function recordBelongsToClient(record: { clientId: string; businessId?: string | null }, key: string) {
  return commercialClientId(record.clientId, record.businessId) === key;
}

export type ContactSnapshot = { name: string; email: string; phone: string; rut: string; address: string; legacyCompanyName?: string };

export function snapshotContact(contact: ClientRecord, legacy = false): ContactSnapshot {
  return {
    name: personName(contact),
    ...(legacy ? { legacyCompanyName: contact.companyName } : {}),
    email: contact.email,
    phone: contact.phone,
    rut: contact.rut,
    address: [contact.address, contact.commune, contact.city, contact.region].filter(Boolean).join(", "),
  };
}

export function parseContactSnapshot(value: unknown): ContactSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const contact = value as Partial<ContactSnapshot>;
  const { name, email, phone, rut, address, legacyCompanyName } = contact;
  return typeof name === "string" && typeof email === "string" && typeof phone === "string" &&
    typeof rut === "string" && typeof address === "string" ? { name, email, phone, rut, address, legacyCompanyName } : null;
}

export function commercialClientFilters(
  accounts: CommercialClient[],
  records: { clientId: string; businessId?: string | null; clientName: string; clientCompany: string }[],
  currentFilter: string,
) {
  const choices = new Map(accounts.map(({ id, name }) => [id, name]));
  for (const record of records) {
    const id = commercialClientId(record.clientId, record.businessId);
    if (!choices.has(id)) choices.set(id, record.businessId ? record.clientCompany || record.clientName : record.clientName);
  }
  if (currentFilter !== "ALL" && !choices.has(currentFilter)) {
    const contact = records.find((record) => record.clientId === currentFilter);
    if (contact) choices.set(currentFilter, `Contacto: ${contact.clientName}`);
  }
  return [...choices].sort(([, left], [, right]) => left.localeCompare(right, "es-CL"));
}
