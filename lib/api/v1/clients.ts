import { Prisma } from "@prisma/client";

import { getPrismaClient } from "../../db";
import { findClientByEmail, type ClientRecord } from "../../clients/repository";
import { ApiError } from "./errors";
import type { ApiClientRecord } from "./types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ContactInput = {
  companyName: string;
  contactFirstName: string;
  contactLastName: string;
  email: string;
  phone: string;
  website: string;
  notes: string;
};

function getPrisma() {
  const client = getPrismaClient();

  if (!client) {
    throw new Error("No hay conexión a la base de datos.");
  }

  return client;
}

function readString(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return value == null ? "" : String(value).trim().replace(/\s+/g, " ");
}

export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ") || firstName;

  return { firstName, lastName };
}

/// Acepta `contactName` completo o `contactFirstName` + `contactLastName`,
/// porque los formularios de las subpáginas suelen tener un solo campo.
export function parseContactInput(input: unknown, field = "contact"): ContactInput {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ApiError("validation_failed", `Falta el objeto ${field}.`);
  }

  const source = input as Record<string, unknown>;
  const email = readString(source, "email").toLowerCase();

  if (!EMAIL_PATTERN.test(email)) {
    throw new ApiError("validation_failed", `${field}.email no es un correo válido.`);
  }

  const explicitFirst = readString(source, "contactFirstName") || readString(source, "firstName");
  const explicitLast = readString(source, "contactLastName") || readString(source, "lastName");
  const fullName = readString(source, "contactName") || readString(source, "name");
  const fallback = splitFullName(fullName);

  const contactFirstName = explicitFirst || fallback.firstName;
  const contactLastName = explicitLast || fallback.lastName || contactFirstName;

  if (!contactFirstName) {
    throw new ApiError("validation_failed", `${field}.contactName es obligatorio.`);
  }

  const companyName = readString(source, "companyName") || readString(source, "company") || contactFirstName;
  const phone = readString(source, "phone");

  return {
    companyName,
    contactFirstName,
    contactLastName,
    email,
    phone,
    website: readString(source, "website"),
    notes: readString(source, "notes") || readString(source, "message"),
  };
}

export type ResolvedClient = {
  client: ClientRecord;
  created: boolean;
};

/// Reutiliza el cliente existente cuando el correo ya está en el CRM, para no
/// duplicar fichas entre el sitio principal y las subpáginas.
export async function resolveOrCreateClient(input: {
  apiClient: ApiClientRecord;
  contact: ContactInput;
  interestServiceId?: string | null;
  interestSubcategoryId?: string | null;
  interestPlanId?: string | null;
  status?: "ACTIVO" | "POTENCIAL";
}): Promise<ResolvedClient> {
  const existing = await findClientByEmail(input.contact.email);

  if (existing) {
    return { client: existing, created: false };
  }

  const interest = await resolveInterestNames({
    serviceId: input.interestServiceId ?? null,
    subcategoryId: input.interestSubcategoryId ?? null,
    planId: input.interestPlanId ?? null,
  });

  try {
    const created = await getPrisma().client.create({
      data: {
        companyName: input.contact.companyName,
        contactFirstName: input.contact.contactFirstName,
        contactLastName: input.contact.contactLastName,
        email: input.contact.email,
        phone: input.contact.phone,
        website: input.contact.website,
        notes: input.contact.notes,
        status: input.status ?? "POTENCIAL",
        commercialStatus: "PROSPECTO",
        apiClientId: input.apiClient.id,
        ...interest,
      },
      include: { assignedExecutive: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });

    return { client: toClientRecord(created), created: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const raced = await findClientByEmail(input.contact.email);

      if (raced) {
        return { client: raced, created: false };
      }
    }

    throw error;
  }
}

async function resolveInterestNames(ids: {
  serviceId: string | null;
  subcategoryId: string | null;
  planId: string | null;
}) {
  const prisma = getPrisma();

  const [service, subcategory, plan] = await Promise.all([
    ids.serviceId
      ? prisma.serviceCategory.findUnique({ where: { id: ids.serviceId }, select: { id: true, name: true } })
      : null,
    ids.subcategoryId
      ? prisma.serviceSubcategory.findUnique({ where: { id: ids.subcategoryId }, select: { id: true, name: true } })
      : null,
    ids.planId
      ? prisma.servicePlan.findUnique({ where: { id: ids.planId }, select: { id: true, name: true } })
      : null,
  ]);

  return {
    interestServiceId: service?.id ?? null,
    interestServiceName: service?.name ?? "",
    interestSubcategoryId: subcategory?.id ?? null,
    interestSubcategoryName: subcategory?.name ?? "",
    interestPlanId: plan?.id ?? null,
    interestPlanName: plan?.name ?? "",
  };
}

type ClientRow = Prisma.ClientGetPayload<{
  include: { assignedExecutive: { select: { id: true; firstName: true; lastName: true; email: true } } };
}>;

function toClientRecord(row: ClientRow): ClientRecord {
  return {
    id: row.id,
    companyName: row.companyName,
    rut: row.rut,
    contactFirstName: row.contactFirstName,
    contactLastName: row.contactLastName,
    email: row.email,
    phone: row.phone,
    address: row.address,
    commune: row.commune,
    city: row.city,
    region: row.region,
    website: row.website,
    notes: row.notes,
    status: row.status,
    commercialStatus: row.commercialStatus,
    assignedExecutiveId: row.assignedExecutiveId,
    assignedExecutive: row.assignedExecutive
      ? {
          id: row.assignedExecutive.id,
          firstName: row.assignedExecutive.firstName,
          lastName: row.assignedExecutive.lastName ?? "",
          email: row.assignedExecutive.email,
        }
      : null,
    interestServiceId: row.interestServiceId,
    interestServiceName: row.interestServiceName,
    interestSubcategoryId: row.interestSubcategoryId,
    interestSubcategoryName: row.interestSubcategoryName,
    interestPlanId: row.interestPlanId,
    interestPlanName: row.interestPlanName,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
