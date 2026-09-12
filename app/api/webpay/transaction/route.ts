import { NextResponse } from "next/server";

import { CheckoutValidationError, buildServerCheckoutOrder } from "@/lib/orders/checkout";
import { createOrderRecord, updateOrderRecord } from "@/lib/orders/repository";
import { generateOrderId } from "@/lib/orders/service";
import { getWebpayReturnUrl, getWebpayTransaction, isAllowedWebpayRedirectUrl, toWebpayAmount } from "@/lib/webpay";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as unknown;
    const checkout = await buildServerCheckoutOrder(payload as Parameters<typeof buildServerCheckoutOrder>[0]);
    const orderId = generateOrderId();
    const sessionId = `${orderId}-session`;
    const amount = toWebpayAmount(checkout.total);

    const order = await createOrderRecord({
      id: orderId,
      customer: checkout.customer,
      items: checkout.items,
      subtotal: checkout.subtotal,
      tax: checkout.tax,
      total: checkout.total,
      paymentStatus: "pending",
      orderStatus: "pending",
      status: "pending",
      paymentMethod: "transbank",
    });

    try {
      const webpay = getWebpayTransaction();
      const response = await webpay.create(orderId, sessionId, amount, getWebpayReturnUrl());

      if (!response?.token || !response?.url || !isAllowedWebpayRedirectUrl(response.url)) {
        throw new Error("Webpay no devolvió una URL de redirección válida.");
      }

      const updated = await updateOrderRecord(order.id, { webpayToken: response.token });

      return NextResponse.json({
        success: true,
        order: updated ?? order,
        webpay: {
          token: response.token,
          url: response.url,
        },
      });
    } catch (error) {
      console.error("[smartpro:webpay:create] Error en Webpay", error);
      await updateOrderRecord(order.id, {
        paymentStatus: "failed",
        orderStatus: "cancelled",
        status: "cancelled",
      });
      return NextResponse.json({ error: "No se pudo iniciar el pago con Webpay." }, { status: 502 });
    }
  } catch (error) {
    if (error instanceof CheckoutValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("[smartpro:webpay:create] Error creando la transacción", error);
    const message = error instanceof Error ? error.message : "No se pudo iniciar la compra.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
