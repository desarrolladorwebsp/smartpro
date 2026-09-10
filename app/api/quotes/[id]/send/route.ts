import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { sendQuoteEmail } from "@/lib/quotes/email";
import { getQuoteById, markQuoteSent } from "@/lib/quotes/repository";
import { canSendQuote } from "@/lib/quotes/status";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const quote = await getQuoteById(id);

    if (!quote) {
      return NextResponse.json({ error: "La cotización no existe." }, { status: 404 });
    }

    if (!canSendQuote(quote.status)) {
      return NextResponse.json({ error: "Esta cotización ya no se puede enviar." }, { status: 400 });
    }

    const result = await sendQuoteEmail(quote);

    if (!result.delivered) {
      return NextResponse.json(
        {
          error: result.error ?? "El correo no se pudo entregar. Revisa la configuración de Resend.",
          delivered: false,
        },
        { status: 502 },
      );
    }

    const sent = await markQuoteSent(quote.id);
    return NextResponse.json({ quote: sent, delivered: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo enviar la cotización.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
