import type { ClientAcquisitionOrigin, Prisma } from "@prisma/client";
import type { CrmArchiveState } from "./crm-archive";
import type { ClientAssignedExecutive, ClientCrmStage, ClientRecord, ClientStatus } from "./types";

export type BusinessRecord = { id: string; name: string; rut: string; address: string };

export type BusinessProfile = BusinessRecord & { crmStage: ClientCrmStage; status: ClientStatus; crmPosition?: number | null; crmArchiveState?: CrmArchiveState | null; responsible?: ClientAssignedExecutive | null; website?: string; notes?: string | null; origin?: ClientAcquisitionOrigin | null; serviceInterests?: Prisma.JsonValue; createdAt?: Date | null };

export function parseBusinessRecipient(value: unknown): BusinessRecord | null {
  if (!value || typeof value !== "object") return null;
  const business = value as Partial<BusinessRecord>;
  return typeof business.id === "string" && typeof business.name === "string" &&
    (typeof business.rut === "string" || business.rut === null) && typeof business.address === "string"
    ? { id: business.id, name: business.name, rut: business.rut ?? "", address: business.address }
    : null;
}

export function normalizeBusinessRut(input: string): string | null {
  const cleaned = input.trim().replace(/[.\s-]/g, "").toUpperCase();
  const match = /^([1-9][0-9]{6,7})([0-9K])$/.exec(cleaned);
  if (!match) return null;

  const [, number, digit] = match;
  const sum = [...number].reverse().reduce((total, char, index) => total + Number(char) * (2 + index % 6), 0);
  const remainder = 11 - sum % 11;
  const verifier = remainder === 11 ? "0" : remainder === 10 ? "K" : String(remainder);
  return digit === verifier ? `${number}-${digit}` : null;
}

export function clientContactLabel(client: ClientRecord): string {
  const contact = [client.contactFirstName, client.contactLastName].filter(Boolean).join(" ");
  return [client.businessName ?? client.companyName, contact].filter(Boolean).join(" · ");
}
