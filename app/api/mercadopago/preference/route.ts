import { NextResponse } from "next/server";

import { CheckoutValidationError, buildServerCheckoutOrder } from "@/lib/orders/checkout";
import { PaymentGatewayError, startMercadoPagoCheckout } from "@/lib/orders/start-payment";
import { publicPaymentErrorPayload } from "@/lib/payments/public-messages";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as unknown;
    const checkout = await buildServerCheckoutOrder(payload as Parameters<typeof buildServerCheckoutOrder>[0]);
    const result = await startMercadoPagoCheckout(checkout);

    return NextResponse.json({
      success: true,
      order: result.order,
      mercadopago: result.mercadopago,
    });
  } catch (error) {
    if (error instanceof CheckoutValidationError) {
      return NextResponse.json(publicPaymentErrorPayload(error, "validation"), { status: 400 });
    }

    if (error instanceof PaymentGatewayError) {
      console.error("[smartpro:mercadopago:preference] Error creando preferencia", error);
      return NextResponse.json(publicPaymentErrorPayload(error, "gateway"), { status: 502 });
    }

    console.error("[smartpro:mercadopago:preference] Error creando la transacción", error);
    return NextResponse.json(publicPaymentErrorPayload(error, "internal"), { status: 500 });
  }
}
