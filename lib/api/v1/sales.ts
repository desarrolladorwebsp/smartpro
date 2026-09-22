import { TAX_RATE } from "../../orders/service";
import {
  createExternalSale,
  findSaleByExternalReference,
  type SaleRecord,
} from "../../sales/repository";
import { isSalePaymentMethod, type SalePaymentMethod } from "../../sales/types";
import { getScopedPlan } from "./catalog";
import { parseContactInput, resolveOrCreateClient, type ContactInput } from "./clients";
import { ApiError } from "./errors";
import type { ApiClientRecord } from "./types";

export const EXTERNAL_SALE_CREATED_BY_EMAIL = "api@smartpro.cl";
export const MAX_OBSERVATION_LENGTH = 2000;

/// Medios admitidos para una venta reportada por una subpágina. Los pagos en
/// línea no se registran por aquí: se crean solos al aprobarse el pago.
export const EXTERNAL_SALE_PAYMENT_METHODS: readonly SalePaymentMethod[] = ["transfer", "cash", "other"];

export type ParsedExternalSale = {
  contact: ContactInput;
  paymentMethod: SalePaymentMethod;
  soldAt: Date;
  observation: string;
  externalReference: string;
  amounts: { subtotal: number; tax: number; total: number };
  interestServiceId: string | null;
  interestPlanId: string | null;
  interestSubcategoryId: string | null;
};

function readString(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return value == null ? "" : String(value).trim();
}

export function parseExternalSalePaymentMethod(value: unknown): SalePaymentMethod {
  const method = String(value ?? "").trim().toLowerCase();

  if (!isSalePaymentMethod(method) || !EXTERNAL_SALE_PAYMENT_METHODS.includes(method)) {
    throw new ApiError(
      "validation_failed",
      `paymentMethod debe ser uno de: ${EXTERNAL_SALE_PAYMENT_METHODS.join(", ")}. Las ventas pagadas con Webpay o Mercado Pago se registran automáticamente.`,
    );
  }

  return method;
}

export function parseSoldAt(value: unknown, now = new Date()): Date {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return now;
  }

  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError("validation_failed", "soldAt debe ser una fecha ISO 8601 válida.");
  }

  if (parsed.getTime() > now.getTime() + 60_000) {
    throw new ApiError("validation_failed", "soldAt no puede estar en el futuro.");
  }

  return parsed;
}

export function parseAmounts(value: unknown): { subtotal: number; tax: number; total: number } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError("validation_failed", "Debes enviar items con planId, o amounts.net con el monto neto.");
  }

  const source = value as Record<string, unknown>;
  const net = Number(source.net);

  if (!Number.isFinite(net) || net <= 0) {
    throw new ApiError("validation_failed", "amounts.net debe ser un monto neto mayor a 0.");
  }

  const subtotal = Math.round(net);
  const tax = source.tax == null ? Math.round(subtotal * TAX_RATE) : Math.round(Number(source.tax));

  if (!Number.isFinite(tax) || tax < 0) {
    throw new ApiError("validation_failed", "amounts.tax debe ser un monto válido.");
  }

  return { subtotal, tax, total: subtotal + tax };
}

async function amountsFromItems(
  client: ApiClientRecord,
  items: unknown,
): Promise<{
  amounts: { subtotal: number; tax: number; total: number };
  interestServiceId: string | null;
  interestSubcategoryId: string | null;
  interestPlanId: string | null;
}> {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError("validation_failed", "items debe ser un arreglo con al menos un plan.");
  }

  let subtotal = 0;
  let tax = 0;
  let firstServiceId: string | null = null;
  let firstSubcategoryId: string | null = null;
  let firstPlanId: string | null = null;

  for (const [index, entry] of items.entries()) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new ApiError("validation_failed", `items[${index}] debe ser un objeto con planId y quantity.`);
    }

    const source = entry as Record<string, unknown>;
    const plan = await getScopedPlan(client, readString(source, "planId"));
    const quantity = source.quantity == null ? 1 : Number(source.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new ApiError("validation_failed", `items[${index}].quantity debe ser un entero mayor a 0.`);
    }

    const lineNet = plan.price * quantity;
    subtotal += lineNet;
    tax += lineNet * (plan.taxRate ?? TAX_RATE);

    firstServiceId ??= plan.categoryId;
    firstSubcategoryId ??= plan.subcategoryId;
    firstPlanId ??= plan.id;
  }

  if (subtotal <= 0) {
    throw new ApiError("validation_failed", "El total de la venta debe ser mayor a 0.");
  }

  return {
    amounts: { subtotal: Math.round(subtotal), tax: Math.round(tax), total: Math.round(subtotal) + Math.round(tax) },
    interestServiceId: firstServiceId,
    interestSubcategoryId: firstSubcategoryId,
    interestPlanId: firstPlanId,
  };
}

export async function parseExternalSaleRequest(
  client: ApiClientRecord,
  body: Record<string, unknown>,
): Promise<ParsedExternalSale> {
  const observation = readString(body, "observation");

  if (observation.length > MAX_OBSERVATION_LENGTH) {
    throw new ApiError("validation_failed", `observation no puede superar ${MAX_OBSERVATION_LENGTH} caracteres.`);
  }

  const contact = parseContactInput(body.client ?? body.customer, "client");
  const paymentMethod = parseExternalSalePaymentMethod(body.paymentMethod);
  const soldAt = parseSoldAt(body.soldAt);
  const externalReference = readString(body, "externalReference").slice(0, 191);

  if (body.items !== undefined) {
    const resolved = await amountsFromItems(client, body.items);

    return {
      contact,
      paymentMethod,
      soldAt,
      observation,
      externalReference,
      ...resolved,
    };
  }

  return {
    contact,
    paymentMethod,
    soldAt,
    observation,
    externalReference,
    amounts: parseAmounts(body.amounts),
    interestServiceId: client.allowedServiceIds[0] ?? null,
    interestSubcategoryId: null,
    interestPlanId: null,
  };
}

export type RegisterExternalSaleResult = {
  sale: SaleRecord;
  duplicate: boolean;
  externalReference: string;
};

export async function registerExternalSale(
  client: ApiClientRecord,
  body: Record<string, unknown>,
): Promise<RegisterExternalSaleResult> {
  const parsed = await parseExternalSaleRequest(client, body);

  if (parsed.externalReference) {
    const existing = await findSaleByExternalReference(client.id, parsed.externalReference);

    if (existing) {
      return { sale: existing, duplicate: true, externalReference: parsed.externalReference };
    }
  }

  const { client: crmClient } = await resolveOrCreateClient({
    apiClient: client,
    contact: parsed.contact,
    interestServiceId: parsed.interestServiceId,
    interestSubcategoryId: parsed.interestSubcategoryId,
    interestPlanId: parsed.interestPlanId,
    status: "ACTIVO",
  });

  const sale = await createExternalSale({
    apiClientId: client.id,
    clientId: crmClient.id,
    assignedExecutiveId: crmClient.assignedExecutiveId,
    createdByEmail: EXTERNAL_SALE_CREATED_BY_EMAIL,
    paymentMethod: parsed.paymentMethod,
    subtotal: parsed.amounts.subtotal,
    tax: parsed.amounts.tax,
    total: parsed.amounts.total,
    soldAt: parsed.soldAt,
    observation: parsed.observation || `Venta registrada por ${client.name}.`,
    externalReference: parsed.externalReference,
  });

  return { sale, duplicate: false, externalReference: parsed.externalReference };
}
