/**
 * Cliente de la API de SmartPro para las subpáginas por servicio.
 *
 * Copia este archivo tal cual en la subpágina (por ejemplo en `lib/smartpro.ts`).
 * No depende de nada del repositorio de SmartPro.
 *
 * Solo debe ejecutarse en el servidor: importa `node:crypto` y usa la clave
 * secreta. Si lo importas desde un componente de cliente, la clave secreta
 * terminaría en el navegador.
 *
 * Variables de entorno esperadas:
 *
 *   SMARTPRO_API_URL=https://smartpro.cl
 *   SMARTPRO_SECRET_KEY=sk_live_...
 *   SMARTPRO_WEBHOOK_SECRET=...
 *   NEXT_PUBLIC_SMARTPRO_PUBLIC_KEY=pk_live_...   (opcional, solo lecturas desde el navegador)
 */

import crypto from "node:crypto";

const API_URL = (process.env.SMARTPRO_API_URL ?? "https://smartpro.cl").replace(/\/$/, "");
const SECRET_KEY = process.env.SMARTPRO_SECRET_KEY ?? "";
const WEBHOOK_SECRET = process.env.SMARTPRO_WEBHOOK_SECRET ?? "";

const SIGNATURE_VERSION = "v1";

export type SmartProErrorBody = {
  error: { code: string; message: string; details?: unknown };
  meta: { requestId: string; apiVersion: string };
};

export class SmartProError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId: string;
  readonly details?: unknown;

  constructor(status: number, body: SmartProErrorBody) {
    super(body?.error?.message ?? "Error al llamar a la API de SmartPro.");
    this.name = "SmartProError";
    this.status = status;
    this.code = body?.error?.code ?? "unknown_error";
    this.requestId = body?.meta?.requestId ?? "";
    this.details = body?.error?.details;
  }
}

function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

/// payload = "v1\n<timestamp>\n<MÉTODO>\n<ruta con query>\n<sha256 del cuerpo>"
function signRequest(timestamp: number, method: string, path: string, body: string): string {
  const payload = [SIGNATURE_VERSION, String(timestamp), method.toUpperCase(), path, sha256Hex(body)].join("\n");
  const digest = crypto.createHmac("sha256", SECRET_KEY).update(payload, "utf8").digest("hex");

  return `${SIGNATURE_VERSION}=${digest}`;
}

type RequestOptions = {
  /// Obligatorio en POST. Un reintento con la misma clave no duplica el cobro.
  idempotencyKey?: string;
  /// Por defecto no se cachea. Útil para el catálogo: `{ revalidate: 300 }`.
  next?: { revalidate?: number; tags?: string[] };
};

async function call<T>(
  method: "GET" | "POST",
  path: string,
  payload?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  if (!SECRET_KEY) {
    throw new Error("Falta SMARTPRO_SECRET_KEY en las variables de entorno.");
  }

  const body = payload === undefined ? "" : JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000);

  const headers: Record<string, string> = {
    authorization: `Bearer ${SECRET_KEY}`,
    "x-smartpro-timestamp": String(timestamp),
    "x-smartpro-signature": signRequest(timestamp, method, path, body),
  };

  if (body) {
    headers["content-type"] = "application/json";
  }

  if (options.idempotencyKey) {
    headers["idempotency-key"] = options.idempotencyKey;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    ...(body ? { body } : {}),
    ...(options.next ? { next: options.next } : { cache: "no-store" }),
  });

  const json = (await response.json()) as unknown;

  if (!response.ok) {
    throw new SmartProError(response.status, json as SmartProErrorBody);
  }

  return (json as { data: T }).data;
}

function buildQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      search.set(key, value);
    }
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}

// ---------------------------------------------------------------------------
// Tipos de la API
// ---------------------------------------------------------------------------

export type Money = { amount: number; currency: "CLP"; formatted: string };

export type Plan = {
  id: string;
  name: string;
  slug: string;
  summary: string;
  badge: string;
  note: string;
  icon: string;
  highlighted: boolean;
  sortOrder: number;
  externalLink: string;
  price: {
    net: Money;
    tax: Money;
    gross: Money;
    taxRate: number;
    taxLabel: string;
    pricePrefix: string;
    /// `true` cuando el plan se cotiza y no puede cobrarse en línea.
    quoteOnly: boolean;
  };
  features: string[];
  featureGroupTitle: string;
  service: { id: string; name: string };
  category: { id: string; name: string };
  updatedAt: string;
};

export type Category = { id: string; name: string; slug: string; sortOrder: number; plans: Plan[] };

export type ServiceSummary = {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImage: string;
  sortOrder: number;
};

export type Service = ServiceSummary & { categories: Category[] };

export type PortfolioProject = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  image: string;
  url: string;
  tags: string[];
  service: { id: string; name: string; slug: string };
  category: { id: string; name: string; slug: string };
  sortOrder: number;
  updatedAt: string;
};

export type CheckoutSession = {
  orderId: string;
  createdAt: string;
  paymentStatus: "pending" | "paid" | "failed" | "cancelled";
  orderStatus: "pending" | "confirmed" | "cancelled";
  paymentMethod: "transbank" | "mercadopago" | "simulated";
  externalReference: string;
  returnUrl: string;
  amounts: { subtotal: Money; tax: Money; total: Money };
  customer: { name: string; email: string; phone: string; company: string };
  items: Array<{ planId: string; name: string; category: string; quantity: number; unitPrice: Money; total: Money }>;
};

export type CheckoutRedirect =
  | { type: "url"; method: "GET"; url: string }
  | { type: "form_post"; method: "POST"; url: string; fields: Record<string, string> };

export type Sale = {
  id: string;
  number: string;
  status: "REGISTERED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  source: "MANUAL" | "QUOTE_ACCEPTED" | "ORDER_PAID" | "EXTERNAL_API";
  soldAt: string;
  paymentMethod: string | null;
  externalReference: string;
  orderId: string | null;
  quoteNumber: string | null;
  observation: string;
  amounts: { subtotal: Money; tax: Money; total: Money };
  client: { id: string; company: string; contactName: string };
  createdAt: string;
};

export type Lead = {
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

export type Customer = { name: string; email: string; phone: string; company?: string };

// ---------------------------------------------------------------------------
// Catálogo
// ---------------------------------------------------------------------------

/// Todo el catálogo al que tiene acceso esta subpágina.
export async function getCatalog(revalidate = 300): Promise<Service[]> {
  const data = await call<{ services: Service[] }>("GET", "/api/v1/catalog", undefined, { next: { revalidate } });
  return data.services;
}

export async function listServices(revalidate = 300): Promise<ServiceSummary[]> {
  const data = await call<{ services: ServiceSummary[] }>("GET", "/api/v1/services", undefined, {
    next: { revalidate },
  });
  return data.services;
}

export async function getService(slug: string, revalidate = 300): Promise<Service> {
  const data = await call<{ service: Service }>("GET", `/api/v1/services/${slug}`, undefined, { next: { revalidate } });
  return data.service;
}

export async function listPlans(
  filters: { service?: string; category?: string } = {},
  revalidate = 300,
): Promise<Plan[]> {
  const path = `/api/v1/plans${buildQuery(filters)}`;
  const data = await call<{ plans: Plan[] }>("GET", path, undefined, { next: { revalidate } });
  return data.plans;
}

export async function getPlan(id: string, revalidate = 300): Promise<Plan> {
  const data = await call<{ plan: Plan }>("GET", `/api/v1/plans/${id}`, undefined, { next: { revalidate } });
  return data.plan;
}

export async function listPortfolio(service?: string, revalidate = 600): Promise<PortfolioProject[]> {
  const path = `/api/v1/portfolio${buildQuery({ service })}`;
  const data = await call<{ projects: PortfolioProject[] }>("GET", path, undefined, { next: { revalidate } });
  return data.projects;
}

// ---------------------------------------------------------------------------
// Pagos
// ---------------------------------------------------------------------------

/// Inicia el pago. El precio lo pone el catálogo de SmartPro: aquí solo se
/// indica qué planes se están comprando.
export async function createCheckoutSession(input: {
  method: "webpay" | "mercadopago";
  returnUrl: string;
  customer: Customer;
  items: Array<{ planId: string; quantity?: number }>;
  externalReference?: string;
  idempotencyKey: string;
}): Promise<{ session: CheckoutSession; redirect: CheckoutRedirect }> {
  const { idempotencyKey, ...payload } = input;

  return call("POST", "/api/v1/checkout/sessions", payload, { idempotencyKey });
}

/// Fuente de verdad del resultado del pago. Úsalo cuando el comprador vuelve a
/// tu sitio y como respaldo si el webhook no llegó.
export async function getCheckoutSession(orderId: string): Promise<{ session: CheckoutSession; sale: Sale | null }> {
  return call("GET", `/api/v1/checkout/sessions/${orderId}`);
}

// ---------------------------------------------------------------------------
// Ventas y leads
// ---------------------------------------------------------------------------

/// Registra una venta cerrada fuera del pago en línea (transferencia, efectivo,
/// acuerdo directo). Las pagadas con Webpay o Mercado Pago se registran solas.
export async function registerSale(input: {
  client: {
    email: string;
    contactName?: string;
    contactFirstName?: string;
    contactLastName?: string;
    companyName?: string;
    phone?: string;
    website?: string;
  };
  paymentMethod: "transfer" | "cash" | "other";
  items?: Array<{ planId: string; quantity?: number }>;
  amounts?: { net: number; tax?: number };
  soldAt?: string;
  observation?: string;
  externalReference?: string;
  idempotencyKey: string;
}): Promise<{ sale: Sale; duplicate: boolean }> {
  const { idempotencyKey, ...payload } = input;

  return call("POST", "/api/v1/sales", payload, { idempotencyKey });
}

export async function listSales(): Promise<Sale[]> {
  const data = await call<{ sales: Sale[] }>("GET", "/api/v1/sales");
  return data.sales;
}

export async function getSale(id: string): Promise<Sale> {
  const data = await call<{ sale: Sale }>("GET", `/api/v1/sales/${id}`);
  return data.sale;
}

/// Crea un cliente potencial en el CRM de SmartPro.
export async function createLead(input: {
  contact: {
    email: string;
    contactName?: string;
    companyName?: string;
    phone?: string;
    website?: string;
  };
  interest?: { serviceSlug?: string; serviceId?: string; categoryId?: string; planId?: string };
  message?: string;
  idempotencyKey: string;
}): Promise<Lead> {
  const { idempotencyKey, ...payload } = input;
  const data = await call<{ lead: Lead }>("POST", "/api/v1/leads", payload, { idempotencyKey });

  return data.lead;
}

/// Verifica que la credencial funciona. Útil al configurar el entorno.
export async function ping(): Promise<{ ok: boolean; client: { name: string; scopes: string[] } }> {
  return call("GET", "/api/v1/ping");
}

// ---------------------------------------------------------------------------
// Webhooks entrantes
// ---------------------------------------------------------------------------

export type WebhookPayload = {
  event: "checkout.paid" | "checkout.failed" | "checkout.cancelled";
  createdAt: string;
  data: CheckoutSession & { saleNumber: string | null };
};

/// Verifica la firma del webhook antes de confiar en su contenido.
/// `rawBody` debe ser el texto exacto recibido, sin volver a serializar.
export function verifyWebhookSignature(input: {
  rawBody: string;
  signatureHeader: string | null;
  timestampHeader: string | null;
  toleranceSeconds?: number;
}): boolean {
  if (!WEBHOOK_SECRET || !input.signatureHeader || !input.timestampHeader) {
    return false;
  }

  const timestamp = Number(input.timestampHeader);

  if (!Number.isFinite(timestamp)) {
    return false;
  }

  const skew = Math.abs(Math.floor(Date.now() / 1000) - timestamp);

  if (skew > (input.toleranceSeconds ?? 300)) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update([SIGNATURE_VERSION, String(timestamp), sha256Hex(input.rawBody)].join("\n"), "utf8")
    .digest("hex");

  const received = input.signatureHeader.replace(`${SIGNATURE_VERSION}=`, "").trim();

  if (received.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(received, "hex"));
}
