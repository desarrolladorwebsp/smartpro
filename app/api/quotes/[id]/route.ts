import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getCurrentAdminSession, requireAdminSession } from "@/lib/auth";
import { parseCommercialClientId } from "@/lib/clients/commercial-clients";
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
    const session = await requireAdminSession();
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      items?: unknown;
      notes?: unknown;
      proposal?: unknown;
      validUntil?: unknown;
      deliveryBusinessDays?: unknown;
      initialPaymentPercent?: unknown;
      discountType?: unknown;
      discountValue?: unknown;
      status?: unknown;
    };

    const quote = await updateQuoteRecord(id, {
      items: parseQuoteItemInputs(body.items),
      proposal: body.proposal,
      notes: typeof body.notes === "string" ? body.notes : "",
      validUntil: body.validUntil === null ? null : typeof body.validUntil === "string" ? body.validUntil : undefined,
      deliveryBusinessDays: body.deliveryBusinessDays as number | string | undefined,
      initialPaymentPercent: body.initialPaymentPercent as number | string | undefined,
      discount: parseQuoteDiscount({ type: body.discountType, value: body.discountValue }),
      status: body.status === "DRAFT" ? "DRAFT" : body.status === "CREATED" ? "CREATED" : undefined,
      actorEmail: session.email,
    });

    revalidatePath("/dashboard/clientes");
    return NextResponse.json({ quote }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar la cotización.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentAdminSession();
    if (!session) return NextResponse.json({ error: "Inicia sesión para actualizar la cotización." }, { status: 401 });
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { status?: unknown; clientKey?: unknown };

    if (!isQuoteStatus(body.status)) {
      return NextResponse.json({ error: "Estado de cotización inválido." }, { status: 400 });
    }

    if (!canSetQuoteStatusManually(body.status)) {
      return NextResponse.json(
        { error: "La cotización solo se marca como enviada al confirmar el envío por correo." },
        { status: 400 },
      );
    }

    const clientKey = typeof body.clientKey === "string" ? body.clientKey : "";
    const decisionClient = clientKey.length <= 191 ? parseCommercialClientId(clientKey) : null;
    if (body.clientKey !== undefined && (!decisionClient || (body.status !== "ACCEPTED" && body.status !== "REJECTED"))) {
      return NextResponse.json({ error: "Decisión de cotización inválida." }, { status: 400 });
    }

    const quote = await updateQuoteStatus(id, body.status, session.email, decisionClient ?? undefined);
    revalidatePath("/dashboard/clientes");
    return NextResponse.json({ quote }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar la cotización.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
