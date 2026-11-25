import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { parseCommercialClientId } from "@/lib/clients/commercial-clients";
import { parseQuoteItemInputs } from "@/lib/quotes/custom-item";
import { parseQuoteDiscount } from "@/lib/quotes/pricing";
import { createQuoteRecord, listQuotes, listQuotesForDecision } from "@/lib/quotes/repository";
import { isQuoteStatus, type QuoteStatus } from "@/lib/quotes/types";

export async function GET(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No se pudieron cargar las cotizaciones." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("context") === "decision") {
      const clientKey = searchParams.get("clientId") ?? "";
      const client = parseCommercialClientId(clientKey);
      if (!client || clientKey.length > 191) {
        return NextResponse.json({ error: "Cliente inválido." }, { status: 400 });
      }

      const quotes = await listQuotesForDecision(client);
      return NextResponse.json({ quotes }, { headers: { "Cache-Control": "private, no-store" } });
    }

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
      accountId?: unknown;
      agencyId?: unknown;
      items?: unknown;
      notes?: unknown;
      proposal?: unknown;
      validUntil?: unknown;
      deliveryBusinessDays?: unknown;
      initialPaymentPercent?: unknown;
      discountType?: unknown;
      discountValue?: unknown;
      status?: unknown;
      origin?: unknown;
    };

    const quote = await createQuoteRecord({
      clientId: String(body.clientId ?? ""),
      accountId: typeof body.accountId === "string" ? body.accountId : undefined,
      agencyId: typeof body.agencyId === "string" ? body.agencyId : "smartpro",
      items: parseQuoteItemInputs(body.items),
      proposal: body.proposal,
      notes: typeof body.notes === "string" ? body.notes : "",
      validUntil: body.validUntil === null ? null : typeof body.validUntil === "string" ? body.validUntil : undefined,
      deliveryBusinessDays: body.deliveryBusinessDays as number | string | undefined,
      initialPaymentPercent: body.initialPaymentPercent as number | string | undefined,
      discount: parseQuoteDiscount({ type: body.discountType, value: body.discountValue }),
      status: body.status === "DRAFT" ? "DRAFT" : "CREATED",
      createdByEmail: session.email,
      origin: body.origin === "clients-board" ? body.origin : undefined,
    });

    if (quote.status === "CREATED") revalidatePath("/dashboard/clientes");
    return NextResponse.json({ quote }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear la cotización.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
