import { NextResponse } from "next/server";

import { buildOpenApiDocument } from "@/lib/api/v1/openapi";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function resolveServerUrl(request: Request): string {
  const configured = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

/// La especificación es pública a propósito: es el contrato que consumen las
/// subpáginas y no expone ningún dato del negocio.
export async function GET(request: Request) {
  return NextResponse.json(buildOpenApiDocument(resolveServerUrl(request)), {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
