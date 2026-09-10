import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { listQuotesForSaleConversion } from "@/lib/sales/repository";

export async function GET(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No se pudieron cargar las cotizaciones." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const clientId = String(searchParams.get("clientId") ?? "").trim();

    if (!clientId) {
      return NextResponse.json({ error: "Selecciona un cliente." }, { status: 400 });
    }

    const quotes = await listQuotesForSaleConversion(clientId);
    return NextResponse.json({ quotes }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[smartpro:sales:quotes]", error);
    return NextResponse.json({ error: "No se pudieron cargar las cotizaciones del cliente." }, { status: 500 });
  }
}
