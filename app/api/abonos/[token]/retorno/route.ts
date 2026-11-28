import { NextResponse } from "next/server";

import { getAppUrl } from "@/lib/app-url";
import { confirmPaymentRequest, paymentRequestPath, validPaymentRequestToken } from "@/lib/sales/payment-requests";
import { classifyWebpayReturn, readWebpayReturnParams } from "@/lib/webpay";

export const runtime = "nodejs";

async function handleReturn(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  if (!validPaymentRequestToken(token)) return new Response(null, { status: 404 });
  try {
    await confirmPaymentRequest(token, classifyWebpayReturn(await readWebpayReturnParams(request)));
  } catch {
    console.error("[smartpro:abono] No se pudo confirmar el retorno de Webpay.");
  }
  return NextResponse.redirect(getAppUrl() + paymentRequestPath(token), { status: 303, headers: { "Cache-Control": "no-store" } });
}

export const GET = handleReturn;
export const POST = handleReturn;
