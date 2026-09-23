import { deriveWebhookSecret } from "./keys";
import type { ApiClientRecord } from "./types";

export type ConnectionCheck = {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
};

export type SatelliteProbe = {
  ok: boolean;
  configured: boolean;
  apiHost: string;
  code: string;
  message: string;
  catalog: { ok: boolean; count: number; code: string; message: string };
  portfolio: { ok: boolean; count: number; code: string; message: string };
};

export type VisitorProbe = {
  reachable: boolean;
  status: number;
  plans: number | null;
  projects: number | null;
  message: string;
};

export type ConnectionReport = {
  ok: boolean;
  siteUrl: string | null;
  summary: string;
  checks: ConnectionCheck[];
  health: SatelliteProbe | null;
  visitor: VisitorProbe | null;
};

const REQUIRED_SCOPES = [
  ["catalog:read", "Leer el catálogo"],
  ["portfolio:read", "Leer el portafolio"],
  ["checkout:write", "Iniciar pagos"],
  ["leads:write", "Crear clientes potenciales"],
] as const;

export function publicSiteUrl(origins: string[]): string | null {
  for (const origin of origins) {
    const normalized = origin.trim().replace(/\/$/, "");

    if (!/^https:\/\//i.test(normalized)) continue;
    if (/localhost|127\.0\.0\.1/i.test(normalized)) continue;

    return normalized;
  }

  return null;
}

export function assessApiClientConfig(client: ApiClientRecord): ConnectionCheck[] {
  const siteUrl = publicSiteUrl(client.allowedOrigins);
  const checks: ConnectionCheck[] = [
    client.status === "ACTIVE"
      ? { id: "status", label: "Credencial", ok: true, detail: "Activa." }
      : { id: "status", label: "Credencial", ok: false, detail: `Estado ${client.status}.` },
    siteUrl
      ? { id: "site", label: "Sitio público", ok: true, detail: siteUrl }
      : { id: "site", label: "Sitio público", ok: false, detail: "No hay un origen https. Solo está autorizado localhost u otro esquema." },
  ];

  for (const [scope, label] of REQUIRED_SCOPES) {
    checks.push(
      client.scopes.includes(scope)
        ? { id: scope, label, ok: true, detail: "Permiso concedido." }
        : { id: scope, label, ok: false, detail: `Falta el permiso ${scope}.` },
    );
  }

  const returnOk = Boolean(siteUrl && client.allowedReturnUrls.some((url) => url.startsWith(`${siteUrl}/`)));
  checks.push(
    returnOk
      ? { id: "return", label: "Retorno del pago", ok: true, detail: "Hay una URL de retorno en el sitio." }
      : { id: "return", label: "Retorno del pago", ok: false, detail: "Falta autorizar la URL a la que vuelve el comprador." },
  );

  const webhookOk = Boolean(siteUrl && client.webhookUrl.startsWith(`${siteUrl}/`));
  checks.push(
    webhookOk
      ? { id: "webhook", label: "Webhook", ok: true, detail: client.webhookUrl }
      : { id: "webhook", label: "Webhook", ok: false, detail: client.webhookUrl || "Sin URL de webhook." },
  );

  return checks;
}

export function readVisitorMarkers(html: string): { plans: number | null; projects: number | null } {
  const plans = /data-smartpro-plans="(\d+)"/.exec(html);
  const projects = /data-smartpro-projects="(\d+)"/.exec(html);

  return {
    plans: plans ? Number(plans[1]) : null,
    projects: projects ? Number(projects[1]) : null,
  };
}

export function describeVisitor(status: number, html: string): VisitorProbe {
  if (status < 200 || status >= 400) {
    return {
      reachable: false,
      status,
      plans: null,
      projects: null,
      message: `El sitio respondió ${status}.`,
    };
  }

  const markers = readVisitorMarkers(html);

  if (markers.plans === null) {
    const hasSolutions = html.includes("Soluciones digitales");

    return {
      reachable: true,
      status,
      plans: hasSolutions ? null : 0,
      projects: null,
      message: hasSolutions
        ? "La página muestra soluciones, pero es una versión sin el marcador de diagnóstico."
        : "La página publicada no muestra la sección de planes.",
    };
  }

  if (markers.plans === 0 || markers.projects === 0) {
    return {
      reachable: true,
      status,
      plans: markers.plans,
      projects: markers.projects,
      message: `El visitante ve ${markers.plans} planes y ${markers.projects ?? 0} proyectos.`,
    };
  }

  return {
    reachable: true,
    status,
    plans: markers.plans,
    projects: markers.projects,
    message: `El visitante ve ${markers.plans} planes y ${markers.projects} proyectos.`,
  };
}

function emptyProbe(code: string, message: string): SatelliteProbe {
  const failed = { ok: false, count: 0, code, message };

  return { ok: false, configured: false, apiHost: "", code, message, catalog: failed, portfolio: failed };
}

function isSatelliteProbe(value: unknown): value is SatelliteProbe {
  if (!value || typeof value !== "object") return false;

  const probe = value as Partial<SatelliteProbe>;

  return typeof probe.ok === "boolean" && typeof probe.code === "string" && typeof probe.message === "string";
}

async function readText(response: Response): Promise<string> {
  return response.text().catch(() => "");
}

export async function inspectApiConnection(client: ApiClientRecord): Promise<ConnectionReport> {
  const checks = assessApiClientConfig(client);
  const siteUrl = publicSiteUrl(client.allowedOrigins);

  if (!siteUrl) {
    return finish(checks, null, null, null);
  }

  const [visitor, health] = await Promise.all([probeVisitor(siteUrl), probeHealth(siteUrl, client.id)]);

  if (!visitor.reachable) {
    checks.push({ id: "visitor", label: "Página publicada", ok: false, detail: visitor.message });
  } else if ((visitor.plans ?? 0) > 0 && (visitor.projects ?? 0) > 0) {
    checks.push({ id: "visitor", label: "Página publicada", ok: true, detail: visitor.message });
  } else {
    checks.push({ id: "visitor", label: "Página publicada", ok: false, detail: visitor.message });
  }

  if (!health) {
    checks.push({ id: "health", label: "Diagnóstico del sitio", ok: false, detail: "No se pudo consultar /api/smartpro/health." });
  } else if (health.ok) {
    checks.push({
      id: "health",
      label: "API desde el sitio",
      ok: true,
      detail: `${health.catalog.message} ${health.portfolio.message}`.trim(),
    });
  } else {
    checks.push({ id: "health", label: "API desde el sitio", ok: false, detail: health.message });
  }

  return finish(checks, siteUrl, health, visitor);
}

function finish(
  checks: ConnectionCheck[],
  siteUrl: string | null,
  health: SatelliteProbe | null,
  visitor: VisitorProbe | null,
): ConnectionReport {
  const failedHealth = checks.find((check) => check.id === "health" && !check.ok);
  const failedVisitor = checks.find((check) => check.id === "visitor" && !check.ok);
  const failedConfig = checks.find((check) => !check.ok && check.id !== "health" && check.id !== "visitor");
  const failed = failedHealth ?? failedVisitor ?? failedConfig;

  return {
    ok: checks.every((check) => check.ok),
    siteUrl,
    summary: failed?.detail ?? "La conexión está correcta.",
    checks,
    health,
    visitor,
  };
}

async function probeVisitor(siteUrl: string): Promise<VisitorProbe> {
  try {
    const response = await fetch(siteUrl, { cache: "no-store", signal: AbortSignal.timeout(12_000), redirect: "follow" });
    const html = await readText(response);

    return describeVisitor(response.status, html);
  } catch (error) {
    return {
      reachable: false,
      status: 0,
      plans: null,
      projects: null,
      message: error instanceof Error ? error.message : "No se pudo abrir el sitio.",
    };
  }
}

async function probeHealth(siteUrl: string, apiClientId: string): Promise<SatelliteProbe | null> {
  try {
    const response = await fetch(`${siteUrl}/api/smartpro/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
      headers: { "x-smartpro-health": deriveWebhookSecret(apiClientId) },
    });
    const json = (await response.json().catch(() => null)) as unknown;

    if (isSatelliteProbe(json)) {
      return {
        ok: json.ok,
        configured: json.configured ?? false,
        apiHost: json.apiHost ?? "",
        code: json.code,
        message: json.message,
        catalog: json.catalog ?? { ok: false, count: 0, code: json.code, message: json.message },
        portfolio: json.portfolio ?? { ok: false, count: 0, code: json.code, message: json.message },
      };
    }

    if (response.status === 404) {
      return emptyProbe("not_deployed", "El sitio todavía no publica /api/smartpro/health. Falta desplegar esta versión.");
    }

    return emptyProbe("invalid_health", `El diagnóstico respondió ${response.status} sin un informe reconocible.`);
  } catch (error) {
    return emptyProbe("connection_error", error instanceof Error ? error.message : "No se pudo consultar el diagnóstico.");
  }
}
