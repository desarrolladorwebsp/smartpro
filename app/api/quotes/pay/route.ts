import { NextResponse } from "next/server";

import { publicPaymentErrorPayload } from "@/lib/payments/public-messages";
import { isQuoteOnlinePaymentMethod, QuotePaymentError, startQuoteOnlinePayment } from "@/lib/quotes/pay";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => null)) as { token?: unknown; method?: unknown } | null;
    const token = String(payload?.token ?? "").trim();
    const method = payload?.method;

    if (!token) {
      return NextResponse.json(publicPaymentErrorPayload("El enlace de pago no es válido.", "validation"), { status: 400 });
    }

    if (!isQuoteOnlinePaymentMethod(method)) {
      return NextResponse.json(publicPaymentErrorPayload("Selecciona Webpay o Mercado Pago.", "validation"), { status: 400 });
    }

    const result = await startQuoteOnlinePayment(token, method);

    return NextResponse.json(
      {
        success: true,
        quoteNumber: result.quoteNumber,
        order: result.order,
        webpay: "webpay" in result ? result.webpay : undefined,
        mercadopago: "mercadopago" in result ? result.mercadopago : undefined,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof QuotePaymentError) {
      const kind = error.status >= 500 ? "gateway" : "validation";
      if (kind === "gateway") {
        console.error("[smartpro:quotes:pay]", error);
      }
      return NextResponse.json(publicPaymentErrorPayload(error, kind), { status: error.status });
    }

    console.error("[smartpro:quotes:pay]", error);
    return NextResponse.json(publicPaymentErrorPayload(error, "internal"), { status: 500 });
  }
}
