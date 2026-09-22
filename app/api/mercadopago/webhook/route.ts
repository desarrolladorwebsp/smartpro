import { NextResponse } from "next/server";

import { finalizeApiCheckoutReturn } from "@/lib/api/v1/checkout-return";
import { checkoutResultStatus } from "@/lib/mercadopago/status";
import { handleMercadoPagoWebhook } from "@/lib/mercadopago/webhook";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const result = await handleMercadoPagoWebhook(request);

  if (result.order) {
    await finalizeApiCheckoutReturn(result.order, checkoutResultStatus(result.order.paymentStatus));
  }

  return NextResponse.json(result.body, { status: result.status });
}
