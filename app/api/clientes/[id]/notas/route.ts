import { NextResponse } from "next/server";
import { getCurrentAdminSession } from "@/lib/auth";
import { accountApiError } from "@/lib/clients/account-repository";
import { createAccountNote } from "@/lib/clients/repository";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentAdminSession();
  if (!session) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    const content = typeof body?.content === "string" ? body.content : "";
    const note = await createAccountNote(id, { content }, session.email);
    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    const result = accountApiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
