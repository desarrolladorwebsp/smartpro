import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentAdminSession } from "@/lib/auth";
import { updateBusinessDetails } from "@/lib/clients/business-repository";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentAdminSession())) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });

  try {
    const { id } = await params;
    const business = await updateBusinessDetails(id, await request.json());
    return NextResponse.json({ business });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "La empresa no existe." }, { status: 404 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo actualizar la empresa." }, { status: 400 });
  }
}
