import { Prisma } from "@prisma/client";

import { getPrismaClient } from "../../db";
import type { CustomerOrder } from "../../orders/repository";
import { deriveWebhookSecret } from "./keys";
import { presentCheckoutSession } from "./presenters";
import { getApiClientById } from "./repository";
import { signWebhookPayload } from "./signature";

export const WEBHOOK_EVENTS = ["checkout.paid", "checkout.failed", "checkout.cancelled"] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export const WEBHOOK_MAX_ATTEMPTS = 5;
export const WEBHOOK_TIMEOUT_MS = 8000;

/// Reintentos espaciados: 1 min, 5 min, 15 min, 1 h.
const RETRY_DELAYS_MS = [60_000, 300_000, 900_000, 3_600_000];

export function eventForPaymentStatus(status: CustomerOrder["paymentStatus"]): WebhookEvent | null {
  if (status === "paid") return "checkout.paid";
  if (status === "failed") return "checkout.failed";
  if (status === "cancelled") return "checkout.cancelled";
  return null;
}

export function nextAttemptDelayMs(attempts: number): number | null {
  return RETRY_DELAYS_MS[attempts - 1] ?? null;
}

function getPrisma() {
  return getPrismaClient();
}

async function sendWebhookRequest(input: {
  url: string;
  secret: string;
  event: WebhookEvent;
  deliveryId: string;
  payload: unknown;
}): Promise<{ ok: boolean; status: number | null; error: string }> {
  const body = JSON.stringify(input.payload);
  const timestamp = Math.floor(Date.now() / 1000);

  try {
    const response = await fetch(input.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "SmartPro-Webhooks/1.0",
        "x-smartpro-event": input.event,
        "x-smartpro-delivery": input.deliveryId,
        "x-smartpro-timestamp": String(timestamp),
        "x-smartpro-signature": signWebhookPayload({ secret: input.secret, timestamp, body }),
      },
      body,
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
      cache: "no-store",
    });

    return {
      ok: response.ok,
      status: response.status,
      error: response.ok ? "" : `El destino respondió ${response.status}.`,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      error: error instanceof Error ? error.message : "No se pudo entregar el webhook.",
    };
  }
}

async function attemptDelivery(deliveryId: string): Promise<void> {
  const prisma = getPrisma();

  if (!prisma) {
    return;
  }

  const delivery = await prisma.apiWebhookDelivery.findUnique({
    where: { id: deliveryId },
    include: { apiClient: { select: { id: true, webhookUrl: true, status: true } } },
  });

  if (!delivery || delivery.status === "SENT") {
    return;
  }

  if (!delivery.apiClient?.webhookUrl || delivery.apiClient.status !== "ACTIVE") {
    return;
  }

  const attempts = delivery.attempts + 1;
  const result = await sendWebhookRequest({
    url: delivery.apiClient.webhookUrl,
    secret: deriveWebhookSecret(delivery.apiClient.id),
    event: delivery.event as WebhookEvent,
    deliveryId: delivery.id,
    payload: delivery.payload,
  });

  const delay = nextAttemptDelayMs(attempts);
  const exhausted = attempts >= WEBHOOK_MAX_ATTEMPTS || delay === null;

  await prisma.apiWebhookDelivery
    .update({
      where: { id: delivery.id },
      data: {
        attempts,
        responseStatus: result.status,
        lastError: result.error,
        status: result.ok ? "SENT" : exhausted ? "FAILED" : "PENDING",
        deliveredAt: result.ok ? new Date() : null,
        nextAttemptAt: result.ok || exhausted ? null : new Date(Date.now() + delay),
      },
    })
    .catch((error) => {
      console.error("[smartpro:api:v1:webhook:update]", error);
    });
}

/// Encola (y despacha de inmediato) la notificación de un cambio de pago hacia
/// la aplicación que originó la orden. La restricción única por
/// aplicación + evento + orden garantiza que nunca se avise dos veces.
export async function notifyApiClientOfOrder(
  order: CustomerOrder | null | undefined,
  extra: { saleNumber?: string | null } = {},
): Promise<void> {
  if (!order?.apiClientId) {
    return;
  }

  const event = eventForPaymentStatus(order.paymentStatus);

  if (!event) {
    return;
  }

  const prisma = getPrisma();

  if (!prisma) {
    return;
  }

  try {
    const client = await getApiClientById(order.apiClientId);

    if (!client?.webhookUrl || client.status !== "ACTIVE") {
      return;
    }

    const payload = {
      event,
      createdAt: new Date().toISOString(),
      data: {
        ...presentCheckoutSession(order),
        saleNumber: extra.saleNumber ?? null,
      },
    };

    const delivery = await prisma.apiWebhookDelivery.create({
      data: {
        apiClientId: order.apiClientId,
        event,
        resourceId: order.id,
        payload: payload as unknown as Prisma.InputJsonValue,
        nextAttemptAt: new Date(),
      },
    });

    await attemptDelivery(delivery.id);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return;
    }

    console.error("[smartpro:api:v1:webhook]", error);
  }
}

/// Reintenta las entregas vencidas. Se invoca de forma oportunista desde los
/// endpoints de consulta, que es el momento en que el sitio satélite está
/// esperando la confirmación.
export async function retryPendingApiWebhooks(limit = 5): Promise<void> {
  const prisma = getPrisma();

  if (!prisma) {
    return;
  }

  try {
    const pending = await prisma.apiWebhookDelivery.findMany({
      where: { status: "PENDING", nextAttemptAt: { lte: new Date() } },
      orderBy: { nextAttemptAt: "asc" },
      take: limit,
      select: { id: true },
    });

    for (const delivery of pending) {
      await attemptDelivery(delivery.id);
    }
  } catch (error) {
    console.error("[smartpro:api:v1:webhook:retry]", error);
  }
}
