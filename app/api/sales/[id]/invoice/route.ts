import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { getLiorenConfig, createDefaultLiorenInvoiceDraft, issueLiorenInvoice } from "@/lib/sales/lioren";
import { getSaleById } from "@/lib/sales/repository";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const sale = await getSaleById(id);
    if (!sale) return NextResponse.json({ error: "La venta no existe." }, { status: 404 });
    const draft = sale.liorenInvoice.draft ?? await createDefaultLiorenInvoiceDraft(sale);
    return NextResponse.json({ draft, configured: getLiorenConfig().configured, sale }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudieron cargar los datos de facturación.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!getLiorenConfig().configured) {
    return NextResponse.json({ error: "Lioren no está configurado. Añade LIOREN_API_BASE_URL y LIOREN_API_TOKEN en las variables de entorno del servidor." }, { status: 503 });
  }

  let id = "";
  try {
    id = (await context.params).id;
    const body = await request.json().catch(() => ({})) as { draft?: unknown };
    const sale = await issueLiorenInvoice(id, body.draft);
    return NextResponse.json({ sale }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible emitir la factura.";
    const status = /ya tiene factura|ya se está procesando|no existe|cancelada|coincidir|exenta|códigos|ingresa|selecciona|debe tener|inválid[oa]/i.test(message) ? 422 : 502;
    const sale = id ? await getSaleById(id).catch(() => null) : null;
    return NextResponse.json({ error: message, sale }, { status, headers: { "Cache-Control": "no-store" } });
  }
}
