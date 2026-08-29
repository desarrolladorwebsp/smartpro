import { NextResponse } from "next/server";

import { getOrderRecord } from "@/lib/orders/repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const order = await getOrderRecord(id);

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("[smartpro:order-detail] Error obteniendo orden", error);
    return NextResponse.json({ error: "No se pudo obtener la orden." }, { status: 500 });
  }
}
