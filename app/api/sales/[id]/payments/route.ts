import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { addSalePayment, updateSalePayment } from "@/lib/sales/repository";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  let session: Awaited<ReturnType<typeof requireAdminSession>>;

  try {
    session = await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No se pudo registrar el abono." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const formData = await request.formData();
    const amount = String(formData.get("amount") ?? "");
    const method = String(formData.get("paymentMethod") ?? "").trim();
    const paidAt = String(formData.get("paidAt") ?? "").trim();
    const observation = String(formData.get("observation") ?? "");
    const receiptValue = formData.get("receipt");
    const receipt = receiptValue instanceof File && receiptValue.size > 0 ? receiptValue : null;

    const sale = await addSalePayment(id, {
      amount,
      method,
      observation,
      paidAt,
      receipt,
      createdByEmail: session.email,
    });

    return NextResponse.json({ sale }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo registrar el abono.";
    console.error("[smartpro:sales:payment]", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar el pago." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const formData = await request.formData();
    const paymentId = String(formData.get("paymentId") ?? "").trim();
    if (!paymentId) {
      return NextResponse.json({ error: "Selecciona el pago que quieres modificar." }, { status: 400 });
    }

    const receiptValue = formData.get("receipt");
    const receipt = receiptValue instanceof File && receiptValue.size > 0 ? receiptValue : null;
    const sale = await updateSalePayment(id, paymentId, {
      amount: String(formData.get("amount") ?? ""),
      method: String(formData.get("paymentMethod") ?? "").trim(),
      paidAt: String(formData.get("paidAt") ?? "").trim(),
      observation: String(formData.get("observation") ?? ""),
      receipt,
      removeReceipt: String(formData.get("removeReceipt") ?? "") === "true",
    });

    return NextResponse.json({ sale }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar el pago.";
    console.error("[smartpro:sales:payment:update]", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
