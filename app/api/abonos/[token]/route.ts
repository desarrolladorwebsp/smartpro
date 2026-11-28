import { PaymentRequestError, startPaymentRequest } from "@/lib/sales/payment-requests";

export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: Promise<{ token: string }> }) {
  const headers = { "Cache-Control": "no-store" };
  try {
    return Response.json(await startPaymentRequest((await context.params).token), { headers });
  } catch (error) {
    if (error instanceof PaymentRequestError) return Response.json({ error: error.message }, { status: error.status, headers });
    console.error("[smartpro:abono] No se pudo iniciar el pago en Webpay.");
    return Response.json({ error: "No se pudo iniciar el pago. Intenta nuevamente." }, { status: 502, headers });
  }
}
