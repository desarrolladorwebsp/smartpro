import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";

const LIOREN_LOCATION_API = "https://www.lioren.cl/api";

type LiorenLocationOption = { id: number; nombre: string; region_id?: number; numero?: number };

async function readLocations(path: string, token: string): Promise<LiorenLocationOption[]> {
  const response = await fetch(`${LIOREN_LOCATION_API}/${path}`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const body = await response.json().catch(() => null) as unknown;
  if (!response.ok) throw new Error(`Lioren respondió HTTP ${response.status} al consultar ${path}.`);
  if (!Array.isArray(body)) throw new Error(`Lioren devolvió un formato no reconocido para ${path}.`);

  return body.flatMap((entry): LiorenLocationOption[] => {
    if (!entry || typeof entry !== "object") return [];
    const row = entry as Record<string, unknown>;
    const id = Number(row.id);
    const nombre = typeof row.nombre === "string" ? row.nombre.trim() : "";
    const regionId = Number(row.region_id);
    const numero = Number(row.numero);
    if (!Number.isSafeInteger(id) || id <= 0 || !nombre) return [];
    return [{
      id,
      nombre,
      ...(Number.isSafeInteger(regionId) && regionId > 0 ? { region_id: regionId } : {}),
      ...(Number.isSafeInteger(numero) && numero > 0 ? { numero } : {}),
    }];
  }).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export async function GET(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const token = process.env.LIOREN_API_TOKEN?.trim() ?? "";
  if (!token) return NextResponse.json({ error: "Configura LIOREN_API_TOKEN en el servidor." }, { status: 503 });

  const regionId = new URL(request.url).searchParams.get("region_id")?.trim() ?? "";
  if (regionId && !/^\d+$/.test(regionId)) {
    return NextResponse.json({ error: "El código de región de Lioren no es válido." }, { status: 400 });
  }

  try {
    if (!regionId) {
      const regions = await readLocations("regiones", token);
      if (!regions.length) throw new Error("Lioren no devolvió regiones.");
      return NextResponse.json({ regions }, { headers: { "Cache-Control": "private, max-age=3600" } });
    }

    const [cities, communes] = await Promise.all([
      readLocations(`ciudades?region_id=${encodeURIComponent(regionId)}`, token),
      readLocations(`comunas?region_id=${encodeURIComponent(regionId)}`, token),
    ]);
    if (!cities.length || !communes.length) throw new Error("Lioren no devolvió ciudades o comunas para la región seleccionada.");
    return NextResponse.json({ cities, communes }, { headers: { "Cache-Control": "private, max-age=3600" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo consultar el catálogo de localidades de Lioren.";
    console.error("Lioren locations lookup failed:", message);
    return NextResponse.json({ error: "Lioren no pudo cargar las localidades. Revisa la conexión e inténtalo otra vez." }, { status: 502 });
  }
}
