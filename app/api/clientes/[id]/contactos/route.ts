import { NextResponse } from "next/server";
import { getCurrentAdminSession } from "@/lib/auth";
import { accountApiError, saveAccountContact } from "@/lib/clients/account-repository";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentAdminSession())) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  try {
    const { id } = await params;
    return NextResponse.json({ contact: await saveAccountContact(id, await request.json()) });
  } catch (error) {
    const result = accountApiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
