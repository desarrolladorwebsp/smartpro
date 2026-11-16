import { NextResponse } from "next/server";
import { getCurrentAdminSession } from "@/lib/auth";
import { accountApiError, updateAccount } from "@/lib/clients/account-repository";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentAdminSession())) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  try {
    const { id } = await params;
    return NextResponse.json({ account: await updateAccount(id, await request.json()) });
  } catch (error) {
    const result = accountApiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
