import { NextResponse } from "next/server";
import { getCurrentAdminSession } from "@/lib/auth";
import { accountApiError, createAccount } from "@/lib/clients/account-repository";

export async function POST(request: Request) {
  if (!(await getCurrentAdminSession())) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  try {
    return NextResponse.json({ account: await createAccount(await request.json()) }, { status: 201 });
  } catch (error) {
    const result = accountApiError(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
