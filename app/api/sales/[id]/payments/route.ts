import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { addSalePayment } from "@/lib/sales/repository";

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
    const observation = String(formData.get("observation") ?? "");
    const receiptValue = formData.get("receipt");
    const receipt = receiptValue instanceof File && receiptValue.size > 0 ? receiptValue : null;

    const sale = await addSalePayment(id, {
      amount,
      method,
      observation,
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
