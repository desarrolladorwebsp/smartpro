import { InvalidWebhookSignatureError } from "mercadopago";

import { getMercadoPagoWebhookSecret } from "./config";
import { validateMercadoPagoWebhookSignature } from "./signature";
import {
  applyMercadoPagoPayment,
  getMercadoPagoPayment,
  type ApplyPaymentResult,
  type MercadoPagoPaymentSnapshot,
} from "./sync";

export type WebhookHandlerResult = {
  status: number;
  body: {
    ok: boolean;
    duplicate?: boolean;
    ignored?: boolean;
    error?: string;
  };
};

type MercadoPagoWebhookBody = {
  type?: string;
  action?: string;
  data?: { id?: string | number };
};

export type MercadoPagoWebhookDeps = {
  getSecret?: () => string;
  getPayment?: (paymentId: string | number) => Promise<MercadoPagoPaymentSnapshot>;
  applyPayment?: (payment: MercadoPagoPaymentSnapshot) => Promise<ApplyPaymentResult>;
};

export function parseWebhookPaymentId(requestUrl: string, body: MercadoPagoWebhookBody) {
  const queryId = new URL(requestUrl).searchParams.get("data.id");
  const bodyId = body.data?.id;
  return String(queryId || bodyId || "").trim();
}

export async function handleMercadoPagoWebhook(
  request: Request,
  deps: MercadoPagoWebhookDeps = {},
): Promise<WebhookHandlerResult> {
  let body: MercadoPagoWebhookBody = {};

  try {
    body = (await request.json()) as MercadoPagoWebhookBody;
  } catch {
    body = {};
  }

  const url = new URL(request.url);

  try {
    validateMercadoPagoWebhookSignature({
      xSignature: request.headers.get("x-signature"),
      xRequestId: request.headers.get("x-request-id"),
      dataId: url.searchParams.get("data.id"),
      secret: (deps.getSecret ?? getMercadoPagoWebhookSecret)(),
    });
  } catch (error) {
    if (error instanceof InvalidWebhookSignatureError) {
      console.error("[smartpro:mercadopago:webhook] Firma inválida", {
        reason: error.reason,
        requestId: error.requestId ?? null,
      });
      return { status: 401, body: { ok: false, error: "Firma de webhook inválida." } };
    }

    const message = error instanceof Error ? error.message : "No se pudo validar el webhook.";
    console.error("[smartpro:mercadopago:webhook] Error de validación", message);
    return { status: 500, body: { ok: false, error: message } };
  }

  const topic = String(body.type ?? url.searchParams.get("type") ?? "").trim().toLowerCase();

  if (topic && topic !== "payment") {
    return { status: 200, body: { ok: true, ignored: true } };
  }

  const paymentId = parseWebhookPaymentId(request.url, body);

  if (!paymentId) {
    console.error("[smartpro:mercadopago:webhook] Notificación sin data.id");
    return { status: 400, body: { ok: false, error: "Notificación sin identificador de pago." } };
  }

  try {
    const payment = await (deps.getPayment ?? getMercadoPagoPayment)(paymentId);
    const result = await (deps.applyPayment ?? applyMercadoPagoPayment)(payment);

    console.info("[smartpro:mercadopago:webhook] Pago sincronizado", {
      paymentId,
      status: payment.status ?? null,
      orderId: result.order?.id ?? null,
      duplicate: result.duplicate,
    });

    return { status: 200, body: { ok: true, duplicate: result.duplicate } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo procesar el pago.";
    console.error("[smartpro:mercadopago:webhook] Error al procesar", {
      paymentId,
      error: message,
    });
    return { status: 500, body: { ok: false, error: message } };
  }
}
