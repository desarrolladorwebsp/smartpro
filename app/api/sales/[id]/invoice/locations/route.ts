import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { getLiorenConfig } from "@/lib/sales/lioren";

type Location = { region: string; ciudad: string; ciudadCodigo: string; comuna: string; comunaCodigo: string };

function text(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  if (!value || typeof value !== "object") return "";
  const item = value as Record<string, unknown>;
  return text(item.nombre ?? item.name ?? item.glosa ?? item.descripcion ?? item.label);
}

function code(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  if (!value || typeof value !== "object") return "";
  const item = value as Record<string, unknown>;
  return String(item.codigo ?? item.code ?? item.id ?? item.value ?? "").trim();
}

function normalizeLocations(body: unknown): Location[] {
  const root = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const rows = Array.isArray(body)
    ? body
    : [root.data, root.localidades, root.resultados, root.items].find(Array.isArray) as unknown[] | undefined;
  if (!rows) return [];

  return rows.flatMap((entry): Location[] => {
    if (!entry || typeof entry !== "object") return [];
    const row = entry as Record<string, unknown>;
    const cityValue = row.ciudad ?? row.city ?? row.city_name ?? row.nombre_ciudad ?? row.nombreCiudad;
    const communeValue = row.comuna ?? row.commune ?? row.commune_name ?? row.nombre_comuna ?? row.nombreComuna;
    const location = {
      region: text(row.region ?? row.region_nombre ?? row.regionNombre) || text(cityValue),
      ciudad: text(cityValue),
      ciudadCodigo: code(row.ciudad_codigo ?? row.codigo_ciudad ?? row.city_code ?? row.id_ciudad ?? row.idCiudad ?? (typeof cityValue === "object" ? cityValue : undefined)),
      comuna: text(communeValue),
      comunaCodigo: code(row.comuna_codigo ?? row.codigo_comuna ?? row.commune_code ?? row.id_comuna ?? row.idComuna ?? (typeof communeValue === "object" ? communeValue : undefined)),
    };
    return location.ciudad && location.comuna && location.ciudadCodigo && location.comunaCodigo ? [location] : [];
  }).sort((a, b) => a.region.localeCompare(b.region, "es") || a.ciudad.localeCompare(b.ciudad, "es") || a.comuna.localeCompare(b.comuna, "es"));
}

export async function GET() {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { configured, baseUrl } = getLiorenConfig();
  const token = process.env.LIOREN_API_TOKEN?.trim() ?? "";
  if (!configured) return NextResponse.json({ error: "Lioren no está configurado." }, { status: 503 });
  if (!/^https:\/\//i.test(baseUrl)) return NextResponse.json({ error: "LIOREN_API_BASE_URL debe usar HTTPS." }, { status: 503 });

  try {
    const response = await fetch(`${baseUrl}/localidades`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const body = await response.json().catch(() => null) as unknown;
    if (!response.ok) return NextResponse.json({ error: "Lioren no pudo cargar las localidades." }, { status: 502 });
    const locations = normalizeLocations(body);
    if (!locations.length) return NextResponse.json({ error: "Lioren devolvió un formato de localidades no reconocido." }, { status: 502 });
    return NextResponse.json({ locations }, { headers: { "Cache-Control": "private, max-age=3600" } });
  } catch {
    return NextResponse.json({ error: "No se pudo consultar el catálogo de localidades de Lioren." }, { status: 502 });
  }
}
