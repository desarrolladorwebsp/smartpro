import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "El registro de clientes se realiza desde el dashboard interno de SmartPro.",
    },
    { status: 410 },
  );
}
