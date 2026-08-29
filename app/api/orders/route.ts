import { NextResponse } from "next/server";

import { buildOrderTotals, generateOrderId, parseMoney, sanitizeCartItem, type CartItemDraft } from "@/lib/orders/service";
import { createOrderRecord } from "@/lib/orders/repository";
import { sendOrderNotification } from "@/lib/orders/email";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      customer?: {
        name?: string;
        email?: string;
        phone?: string;
        company?: string;
      };
      items?: Array<Partial<CartItemDraft> & { unitPrice?: number | string }>; 
    };

    const customer = body.customer ?? {};
    const items = Array.isArray(body.items) ? body.items : [];

    const name = String(customer.name ?? "").trim();
    const email = String(customer.email ?? "").trim();
    const phone = String(customer.phone ?? "").trim();
    const company = customer.company ? String(customer.company).trim() : undefined;

    if (!name || !email || !phone) {
      return NextResponse.json({ error: "Faltan datos obligatorios del cliente." }, { status: 400 });
    }

    if (!emailPattern.test(email)) {
      return NextResponse.json({ error: "Correo electrónico inválido." }, { status: 400 });
    }

    if (phone.replace(/\D/g, "").length < 8) {
      return NextResponse.json({ error: "Teléfono inválido." }, { status: 400 });
    }

    if (!items.length) {
      return NextResponse.json({ error: "La orden debe incluir al menos un producto." }, { status: 400 });
    }

    const normalizedItems: CartItemDraft[] = items
      .map((item) => {
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
    const order = await createOrderRecord({
      id: orderId,
      customer: {
        name,
        email,
        phone,
        company,
      },
      items: normalizedItems,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      paymentStatus: "pending",
      orderStatus: "pending",
      paymentMethod: "transbank",
      status: "pending",
    });

    await sendOrderNotification({
      id: order.id,
      createdAt: order.createdAt,
      customer: order.customer,
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
    });

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("[smartpro:orders] Error creando orden", error);
    return NextResponse.json(
      {
        error: "No se pudo crear la orden.",
      },
      { status: 500 },
    );
  }
}
