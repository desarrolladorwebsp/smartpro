import { NextResponse } from "next/server";

import { getOrderRecord, updateOrderStatus } from "@/lib/orders/repository";
import { getWebpayTransaction } from "@/lib/webpay";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenWs = searchParams.get("token_ws");
    const orderId = searchParams.get("orderId");

    if (!tokenWs) {
      const redirectUrl = orderId ? `/checkout/result?status=cancelled&orderId=${encodeURIComponent(orderId)}` : "/checkout/result?status=cancelled";
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    const tx = getWebpayTransaction();
    const response = await tx.commit(tokenWs);
    const order = orderId ? await getOrderRecord(orderId) : null;

    if (!order) {
      return NextResponse.redirect(new URL(`/checkout/result?status=failed&token=${encodeURIComponent(tokenWs)}`, request.url));
    }

    const isApproved = response?.response_code === 0;

    if (isApproved) {
      await updateOrderStatus(order.id, {
        paymentStatus: "paid",
        orderStatus: "confirmed",
        status: "confirmed",
        paymentMethod: "transbank",
      });
      return NextResponse.redirect(new URL(`/checkout/result?status=approved&orderId=${encodeURIComponent(order.id)}`, request.url));
    }

    await updateOrderStatus(order.id, {
      paymentStatus: "failed",
      orderStatus: "cancelled",
      status: "cancelled",
      paymentMethod: "transbank",
    });

    return NextResponse.redirect(new URL(`/checkout/result?status=failed&orderId=${encodeURIComponent(order.id)}`, request.url));
  } catch (error) {
    console.error("[smartpro:webpay:return] Error en retorno de Webpay", error);
    return NextResponse.redirect(new URL("/checkout/result?status=failed", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  }
}
