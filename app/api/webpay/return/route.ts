import { NextResponse } from "next/server";

import { finalizeApiCheckoutReturn } from "@/lib/api/v1/checkout-return";
import { getAppUrl } from "@/lib/app-url";
import type { CustomerOrder } from "@/lib/orders/repository";
import {
  applyWebpayCommit,
  applyWebpayInterrupted,
  checkoutResultFromWebpayKind,
  checkoutResultStatus,
  classifyWebpayReturn,
  getWebpayTransaction,
  isWebpayApproved,
  readWebpayReturnParams,
  toWebpayCommitSnapshot,
} from "@/lib/webpay";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function resultUrl(status: string, orderId?: string | null) {
  const url = new URL("/checkout/result", `${getAppUrl()}/`);
  url.searchParams.set("status", status);
  if (orderId) {
    url.searchParams.set("orderId", orderId);
  }
  return url;
}

async function redirectForOrder(order: CustomerOrder | null, status: string, fallbackOrderId?: string | null) {
  const apiReturnUrl = await finalizeApiCheckoutReturn(order, status);

  return NextResponse.redirect(apiReturnUrl ?? resultUrl(status, order?.id ?? fallbackOrderId));
}

async function handleReturn(request: Request) {
  try {
    const params = await readWebpayReturnParams(request);
    const classified = classifyWebpayReturn(params);

    if (classified.kind !== "commit") {
      const result = await applyWebpayInterrupted({
        kind: classified.kind,
        token: classified.token,
        buyOrder: classified.buyOrder,
      });
      const status = result.order
        ? checkoutResultStatus(result.order.paymentStatus)
        : checkoutResultFromWebpayKind(classified.kind, false);
      return redirectForOrder(result.order ?? null, status, classified.buyOrder);
    }

    const webpay = getWebpayTransaction();
    let snapshot;

    try {
      snapshot = toWebpayCommitSnapshot(classified.token, await webpay.commit(classified.token));
    } catch (error) {
      console.error("[smartpro:webpay:return] commit falló, consultando status", error);
      try {
        snapshot = toWebpayCommitSnapshot(classified.token, await webpay.status(classified.token));
      } catch (statusError) {
        console.error("[smartpro:webpay:return] status también falló", statusError);
        const result = await applyWebpayInterrupted({
          kind: "error",
          token: classified.token,
          buyOrder: classified.buyOrder,
        });
        return redirectForOrder(result.order ?? null, "failed", classified.buyOrder);
      }
    }

    const result = await applyWebpayCommit(snapshot);
    const approved = isWebpayApproved(snapshot);
    const status = result.order
      ? checkoutResultStatus(result.order.paymentStatus)
      : checkoutResultFromWebpayKind("commit", approved);

    return redirectForOrder(result.order ?? null, status, snapshot.buy_order);
  } catch (error) {
    console.error("[smartpro:webpay:return] Error en retorno de Webpay", error);
    return NextResponse.redirect(resultUrl("failed"));
  }
}

export async function GET(request: Request) {
  return handleReturn(request);
}

export async function POST(request: Request) {
  return handleReturn(request);
}
