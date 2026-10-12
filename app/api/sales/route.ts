import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { convertQuoteToSale, createDirectSale, listSales } from "@/lib/sales/repository";

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
    const saleType = String(formData.get("saleType") ?? "QUOTE").trim();
    const quoteId = String(formData.get("quoteId") ?? "").trim();
    const clientId = String(formData.get("clientId") ?? "").trim();
    const serviceName = String(formData.get("serviceName") ?? "").trim();
    const subtotal = String(formData.get("subtotal") ?? "");
    const tax = String(formData.get("tax") ?? "0");
    const soldAt = String(formData.get("soldAt") ?? "").trim();
    const observation = String(formData.get("observation") ?? "");
    const paidAmount = String(formData.get("paidAmount") ?? "0");
    const paymentMethod = String(formData.get("paymentMethod") ?? "").trim();
    const receiptValue = formData.get("receipt");
    const receipt = receiptValue instanceof File && receiptValue.size > 0 ? receiptValue : null;

    if (saleType !== "DIRECT" && saleType !== "QUOTE") {
      return NextResponse.json({ error: "Selecciona el tipo de venta." }, { status: 400 });
    }
    if (saleType === "QUOTE" && !quoteId) {
      return NextResponse.json({ error: "Selecciona una cotización." }, { status: 400 });
    }

    const sale = saleType === "DIRECT"
      ? await createDirectSale({
          clientId,
          serviceName,
          subtotal,
          tax,
          soldAt,
          observation,
          receipt,
          paidAmount,
          paymentMethod,
          createdByEmail: session.email,
        })
      : await convertQuoteToSale({
          quoteId,
          observation,
          receipt,
          paidAmount,
          paymentMethod,
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
