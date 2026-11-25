import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getCurrentAdminSession } from "@/lib/auth";
import { CollectionRequestError, getSaleCollection, saveSaleCollection } from "@/lib/sales/collection-repository";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await getCurrentAdminSession();
  if (!session) return NextResponse.json({ error: "Inicia sesión para ver los cobros." }, { status: 401 });

  try {
    const { id } = await context.params;
    const collection = await getSaleCollection(id, session);
    if (!collection) return NextResponse.json({ error: "La venta no está disponible para programar cobros." }, { status: 404 });
    return NextResponse.json({ collection }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[smartpro:sales:collection]", error);
    return NextResponse.json({ error: "No se pudo cargar el plan de cobro." }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await getCurrentAdminSession();
  if (!session) return NextResponse.json({ error: "Inicia sesión para programar cobros." }, { status: 401 });
  const input: unknown = await request.json().catch(() => null);
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return NextResponse.json({ error: "Revisa la fecha y la forma de pago." }, { status: 400 });
  }

  try {
    const { id } = await context.params;
    const collection = await saveSaleCollection(id, session, input);
    revalidatePath("/dashboard/calendario");
    revalidatePath("/dashboard/ventas");
    revalidatePath(`/dashboard/ventas/${encodeURIComponent(id)}`);
    return NextResponse.json({ collection }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof CollectionRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[smartpro:sales:collection:update]", error);
    return NextResponse.json({ error: "No se pudo guardar el plan de cobro." }, { status: 500 });
  }
}
