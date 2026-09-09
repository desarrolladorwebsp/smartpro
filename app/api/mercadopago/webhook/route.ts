import { NextResponse } from "next/server";

import { handleMercadoPagoWebhook } from "@/lib/mercadopago/webhook";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const result = await handleMercadoPagoWebhook(request);

  return NextResponse.json(result.body, { status: result.status });
}
