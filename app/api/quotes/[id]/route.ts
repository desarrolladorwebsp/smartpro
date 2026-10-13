import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { parseQuoteItemInputs } from "@/lib/quotes/custom-item";
import { parseQuoteDiscount } from "@/lib/quotes/pricing";
import { getQuoteById, updateQuoteRecord, updateQuoteStatus } from "@/lib/quotes/repository";
import { canSetQuoteStatusManually } from "@/lib/quotes/status";
import { isQuoteStatus } from "@/lib/quotes/types";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No se pudo cargar la cotización." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const quote = await getQuoteById(id);

    if (!quote) {
      return NextResponse.json({ error: "La cotización no existe." }, { status: 404 });
    }

    return NextResponse.json({ quote }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[smartpro:quotes:detail]", error);
    return NextResponse.json({ error: "No se pudo cargar la cotización." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      items?: unknown;
      notes?: unknown;
      validUntil?: unknown;
      deliveryBusinessDays?: unknown;
      initialPaymentPercent?: unknown;
      discountType?: unknown;
      discountValue?: unknown;
      status?: unknown;
    };

    const quote = await updateQuoteRecord(id, {
      items: parseQuoteItemInputs(body.items),
      notes: typeof body.notes === "string" ? body.notes : "",
      validUntil: body.validUntil === null ? null : typeof body.validUntil === "string" ? body.validUntil : undefined,
      deliveryBusinessDays: body.deliveryBusinessDays as number | string | undefined,
      initialPaymentPercent: body.initialPaymentPercent as number | string | undefined,
      discount: parseQuoteDiscount({ type: body.discountType, value: body.discountValue }),
      status: body.status === "DRAFT" ? "DRAFT" : body.status === "CREATED" ? "CREATED" : undefined,
    });

    return NextResponse.json({ quote }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar la cotización.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { status?: unknown };

    if (!isQuoteStatus(body.status)) {
      return NextResponse.json({ error: "Estado de cotización inválido." }, { status: 400 });
    }

    if (!canSetQuoteStatusManually(body.status)) {
      return NextResponse.json(
        { error: "La cotización solo se marca como enviada al confirmar el envío por correo." },
        { status: 400 },
      );
    }

    const quote = await updateQuoteStatus(id, body.status);
    return NextResponse.json({ quote }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar la cotización.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
