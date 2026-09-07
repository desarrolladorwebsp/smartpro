import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { createClientNote } from "@/lib/clients/repository";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession();
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { title?: unknown; content?: unknown };
    const note = await createClientNote(
      id,
      { title: String(body.title ?? ""), content: String(body.content ?? "") },
      session.email,
    );

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar la nota.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}