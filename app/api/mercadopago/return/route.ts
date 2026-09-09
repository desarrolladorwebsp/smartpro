import { NextResponse } from "next/server";

import { getAppBaseUrl } from "@/lib/mercadopago/config";
import { checkoutResultStatus } from "@/lib/mercadopago/status";
import { applyMercadoPagoPayment, getMercadoPagoPayment } from "@/lib/mercadopago/sync";
import { getOrderRecord } from "@/lib/orders/repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function resultUrl(status: string, orderId?: string | null) {
  const appUrl = getAppBaseUrl();
  const url = new URL("/checkout/result", `${appUrl}/`);
  url.searchParams.set("status", status);
  if (orderId) {
    url.searchParams.set("orderId", orderId);
  }
  return url;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId") ?? searchParams.get("external_reference");
  const paymentId = searchParams.get("payment_id") ?? searchParams.get("collection_id");

  try {
    if (paymentId) {
      const payment = await getMercadoPagoPayment(paymentId);
      const result = await applyMercadoPagoPayment(payment);
      const status = result.order ? checkoutResultStatus(result.order.paymentStatus) : "failed";
      return NextResponse.redirect(resultUrl(status, result.order?.id ?? orderId));
    }

    const order = orderId ? await getOrderRecord(orderId) : null;

    if (order) {
      return NextResponse.redirect(resultUrl(checkoutResultStatus(order.paymentStatus), order.id));
    }

    return NextResponse.redirect(resultUrl("pending", orderId));
  } catch (error) {
    console.error("[smartpro:mercadopago:return] Error en retorno", error);
    return NextResponse.redirect(resultUrl("failed", orderId));
  }
}
