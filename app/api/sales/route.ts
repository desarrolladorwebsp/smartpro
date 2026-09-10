import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { convertQuoteToSale, listSales } from "@/lib/sales/repository";

export async function GET() {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No se pudieron cargar las ventas." }, { status: 401 });
  }

  try {
    const sales = await listSales();
    return NextResponse.json({ sales }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[smartpro:sales:list]", error);
    return NextResponse.json({ error: "No se pudieron cargar las ventas." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let session: Awaited<ReturnType<typeof requireAdminSession>>;

  try {
    session = await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No se pudo registrar la venta." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const quoteId = String(formData.get("quoteId") ?? "").trim();
    const observation = String(formData.get("observation") ?? "");
    const receiptValue = formData.get("receipt");
    const receipt = receiptValue instanceof File && receiptValue.size > 0 ? receiptValue : null;

    if (!quoteId) {
      return NextResponse.json({ error: "Selecciona una cotización." }, { status: 400 });
    }

    const sale = await convertQuoteToSale({
      quoteId,
      observation,
      receipt,
      createdByEmail: session.email,
      source: "MANUAL",
    });

    return NextResponse.json({ sale }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo registrar la venta.";
    const status = message.includes("ya fue convertida") ? 409 : 400;
    console.error("[smartpro:sales:create]", error);
    return NextResponse.json({ error: message }, { status });
  }
}
