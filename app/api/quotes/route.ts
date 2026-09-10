import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { createQuoteRecord, listQuotes } from "@/lib/quotes/repository";
import { isQuoteStatus, type QuoteItemInput, type QuoteStatus } from "@/lib/quotes/types";

function parseItems(value: unknown): QuoteItemInput[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => {
    const record = item as { planId?: unknown; quantity?: unknown };
    return {
      planId: String(record.planId ?? ""),
      quantity: Number(record.quantity) || 1,
    };
  });
}

export async function GET(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No se pudieron cargar las cotizaciones." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") ?? "ALL";
    const status = statusParam === "ALL" || isQuoteStatus(statusParam) ? statusParam : "ALL";

    const quotes = await listQuotes({
      query: searchParams.get("q") ?? undefined,
      status: status as QuoteStatus | "ALL",
      clientId: searchParams.get("clientId") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });

    return NextResponse.json({ quotes }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[smartpro:quotes:list]", error);
    return NextResponse.json({ error: "No se pudieron cargar las cotizaciones." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession();
    const body = (await request.json().catch(() => ({}))) as {
      clientId?: unknown;
      items?: unknown;
      notes?: unknown;
      validUntil?: unknown;
      deliveryBusinessDays?: unknown;
      initialPaymentPercent?: unknown;
      status?: unknown;
    };

    const quote = await createQuoteRecord({
      clientId: String(body.clientId ?? ""),
      items: parseItems(body.items),
      notes: typeof body.notes === "string" ? body.notes : "",
      validUntil: body.validUntil === null ? null : typeof body.validUntil === "string" ? body.validUntil : undefined,
      deliveryBusinessDays: body.deliveryBusinessDays as number | string | undefined,
      initialPaymentPercent: body.initialPaymentPercent as number | string | undefined,
      status: body.status === "DRAFT" ? "DRAFT" : "CREATED",
      createdByEmail: session.email,
    });

    return NextResponse.json({ quote }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear la cotización.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
