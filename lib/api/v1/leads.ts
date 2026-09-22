import { getPrismaClient } from "../../db";
import { getScopedPlan, isServiceInScope } from "./catalog";
import { parseContactInput, resolveOrCreateClient } from "./clients";
import { ApiError } from "./errors";
import type { ApiClientRecord } from "./types";

export const LEAD_CREATED_BY_EMAIL = "api@smartpro.cl";
export const MAX_MESSAGE_LENGTH = 4000;

export type ApiLead = {
  clientId: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  status: string;
  commercialStatus: string;
  interest: {
    serviceId: string | null;
    serviceName: string;
    categoryId: string | null;
    categoryName: string;
    planId: string | null;
    planName: string;
  };
  createdAt: string;
  /// `false` cuando el correo ya existía en el CRM y se reutilizó la ficha.
  created: boolean;
};

function readString(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return value == null ? "" : String(value).trim();
}

async function resolveInterest(client: ApiClientRecord, input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { serviceId: null, subcategoryId: null, planId: null };
  }

  const source = input as Record<string, unknown>;
  const planId = readString(source, "planId");

  if (planId) {
    const plan = await getScopedPlan(client, planId);
    return { serviceId: plan.categoryId, subcategoryId: plan.subcategoryId, planId: plan.id };
  }

  const serviceSlug = readString(source, "serviceSlug").toLowerCase();
  const serviceId = readString(source, "serviceId");
  const prisma = getPrismaClient();

  if (!prisma || (!serviceSlug && !serviceId)) {
    return { serviceId: null, subcategoryId: null, planId: null };
  }

  const service = await prisma.serviceCategory.findFirst({
    where: serviceId ? { id: serviceId } : { slug: serviceSlug },
    select: { id: true },
  });

  if (!service) {
    throw new ApiError("resource_not_found", "El servicio indicado en interest no existe.");
  }

  if (!isServiceInScope(client, service.id)) {
    throw new ApiError("insufficient_scope", "El servicio indicado en interest está fuera del alcance de esta credencial.");
  }

  const categoryId = readString(source, "categoryId");

  return { serviceId: service.id, subcategoryId: categoryId || null, planId: null };
}

export async function registerLead(client: ApiClientRecord, body: Record<string, unknown>): Promise<ApiLead> {
  const contact = parseContactInput(body.contact ?? body.client ?? body, "contact");
  const message = readString(body, "message") || contact.notes;

  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new ApiError("validation_failed", `message no puede superar ${MAX_MESSAGE_LENGTH} caracteres.`);
  }

  const interest = await resolveInterest(client, body.interest);

  const { client: crmClient, created } = await resolveOrCreateClient({
    apiClient: client,
    contact: { ...contact, notes: message },
    interestServiceId: interest.serviceId,
    interestSubcategoryId: interest.subcategoryId,
    interestPlanId: interest.planId,
    status: "POTENCIAL",
  });

  // La nota deja el mensaje del formulario visible en la ficha del cliente,
  // incluso cuando la ficha ya existía y no se sobreescriben sus datos.
  if (message) {
    const prisma = getPrismaClient();

    await prisma?.clientNote
      .create({
        data: {
          clientId: crmClient.id,
          title: `Contacto desde ${client.name}`,
          content: message,
          executiveEmail: LEAD_CREATED_BY_EMAIL,
        },
      })
      .catch((error) => {
        console.error("[smartpro:api:v1:leads:note]", error);
      });
  }

  return {
    clientId: crmClient.id,
    companyName: crmClient.companyName,
    contactName: `${crmClient.contactFirstName} ${crmClient.contactLastName}`.trim(),
    email: crmClient.email,
    phone: crmClient.phone,
    status: crmClient.status,
    commercialStatus: crmClient.commercialStatus,
    interest: {
      serviceId: crmClient.interestServiceId,
      serviceName: crmClient.interestServiceName,
      categoryId: crmClient.interestSubcategoryId,
      categoryName: crmClient.interestSubcategoryName,
      planId: crmClient.interestPlanId,
      planName: crmClient.interestPlanName,
    },
    createdAt: crmClient.createdAt,
    created,
  };
}
