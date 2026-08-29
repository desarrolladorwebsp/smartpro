import { NextResponse } from "next/server";

import { getOrderRecord } from "@/lib/orders/repository";
import { buildOrderTotals, generateOrderId, parseMoney, sanitizeCartItem, type CartItemDraft } from "@/lib/orders/service";
import { getAppBaseUrl, getWebpayTransaction } from "@/lib/webpay";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const customer = body?.customer ?? {};
    const items = Array.isArray(body?.items) ? body.items : [];

    const name = String(customer.name ?? "").trim();
    const email = String(customer.email ?? "").trim();
    const phone = String(customer.phone ?? "").trim();
    const company = customer.company ? String(customer.company).trim() : undefined;

    if (!name || !email || !phone) {
      return NextResponse.json({ error: "Faltan datos obligatorios del cliente." }, { status: 400 });
    }

    if (!items.length) {
      return NextResponse.json({ error: "La orden debe incluir al menos un producto." }, { status: 400 });
    }

    const normalizedItems: CartItemDraft[] = items
      .map((item: Partial<CartItemDraft> & { unitPrice?: number | string }) => {
        const sanitized = sanitizeCartItem({
          id: item.id,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unitPrice: typeof item.unitPrice === "string" ? parseMoney(item.unitPrice) : Number(item.unitPrice ?? 0),
          priceDisplay: item.priceDisplay,
          taxRate: item.taxRate,
          source: item.source,
        });

        if (!sanitized) {
          return null;
        }

        return {
          ...sanitized,
          quantity: Math.max(1, Number(sanitized.quantity) || 1),
        };
      })
      .filter(Boolean) as CartItemDraft[];

    if (!normalizedItems.length) {
      return NextResponse.json({ error: "Los productos no son válidos." }, { status: 400 });
    }

    const totals = buildOrderTotals(normalizedItems);
    const orderId = generateOrderId();
    const sessionId = `${orderId}-session`;
    const returnUrl = `${getAppBaseUrl()}/api/webpay/return?orderId=${encodeURIComponent(orderId)}`;

    const order = await import("@/lib/orders/repository").then(({ createOrderRecord }) =>
      createOrderRecord({
        id: orderId,
        customer: { name, email, phone, company },
        items: normalizedItems,
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
        paymentStatus: "pending",
        orderStatus: "pending",
        paymentMethod: "transbank",
        status: "pending",
      }),
    );

    try {
      const webpay = getWebpayTransaction();
      const response = await webpay.create(orderId, sessionId, Math.round(totals.total), returnUrl);

      return NextResponse.json({
        success: true,
        order,
        webpay: {
          token: response.token,
          url: response.url,
        },
      });
    } catch (error) {
      console.error("[smartpro:webpay:create] Error en Webpay", error);
      await import("@/lib/orders/repository").then(({ updateOrderStatus }) =>
        updateOrderStatus(orderId, {
          paymentStatus: "failed",
          orderStatus: "cancelled",
          status: "cancelled",
        }),
      );
      return NextResponse.json({ error: "No se pudo iniciar el pago con Webpay." }, { status: 500 });
    }
  } catch (error) {
    console.error("[smartpro:webpay:create] Error creando la transacción", error);
    return NextResponse.json({ error: "No se pudo iniciar la compra." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
