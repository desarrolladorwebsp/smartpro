import { NextResponse } from "next/server";

import { CheckoutValidationError, buildServerCheckoutOrder } from "@/lib/orders/checkout";
import { createOrderRecord, updateOrderRecord } from "@/lib/orders/repository";
import { generateOrderId } from "@/lib/orders/service";
import { createMercadoPagoPreference } from "@/lib/mercadopago/preference";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as unknown;
    const checkout = await buildServerCheckoutOrder(payload as Parameters<typeof buildServerCheckoutOrder>[0]);
    const orderId = generateOrderId();

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
      paymentMethod: "mercadopago",
    });

    try {
      const preference = await createMercadoPagoPreference(order);
      const updated = await updateOrderRecord(order.id, { preferenceId: preference.id });

      return NextResponse.json({
        success: true,
        order: updated ?? order,
        mercadopago: {
          preferenceId: preference.id,
          checkoutUrl: preference.checkoutUrl,
        },
      });
    } catch (error) {
      console.error("[smartpro:mercadopago:preference] Error creando preferencia", error);
      await updateOrderRecord(order.id, {
        paymentStatus: "failed",
        orderStatus: "cancelled",
        status: "cancelled",
      });
      return NextResponse.json({ error: "No se pudo iniciar el pago con Mercado Pago." }, { status: 502 });
    }
  } catch (error) {
    if (error instanceof CheckoutValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("[smartpro:mercadopago:preference] Error creando la transacción", error);
    const message = error instanceof Error ? error.message : "No se pudo iniciar la compra.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
