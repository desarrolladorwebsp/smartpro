import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { getQuoteById } from "@/lib/quotes/repository";
import { buildQuotePdf } from "@/lib/quotes/pdf";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No se pudo generar el PDF." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const quote = await getQuoteById(id);

    if (!quote) {
      return NextResponse.json({ error: "La cotización no existe." }, { status: 404 });
    }

    const pdf = await buildQuotePdf(quote);
    const filename = `${quote.number}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[smartpro:quotes:pdf]", error);
    return NextResponse.json({ error: "No se pudo generar el PDF." }, { status: 500 });
  }
}
