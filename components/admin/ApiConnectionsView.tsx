import Link from "next/link";

import type { ApiClientRecord } from "@/lib/api/v1/types";
import type { ConnectionReport } from "@/lib/api/v1/site-health";

import { DashboardPageHeader } from "./DashboardPageHeader";
import { RecheckButton } from "./RecheckButton";

export type ApiConnectionItem = {
  client: ApiClientRecord;
  report: ConnectionReport;
};

function StatusPill({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-full px-3 text-xs font-bold uppercase tracking-[0.14em] ${
        ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
      }`}
    >
      {ok ? "OK" : "Error"}
    </span>
  );
}

function formatWhen(value: string | null) {
  if (!value) return "Nunca";

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Santiago",
  }).format(new Date(value));
}

export function ApiConnectionsList({ items }: { items: ApiConnectionItem[] }) {
  return (
    <div>
      <DashboardPageHeader icon="apis" eyebrow="Conexiones" title="APIs" trailing={<RecheckButton />} />

      <div className="mt-6 grid gap-4">
        {items.length === 0 ? (
          <p className="rounded-3xl border border-border bg-white px-6 py-10 text-sm text-muted">
            No hay aplicaciones de API. Crea la credencial de una subpágina con <code>npm run api:client</code>.
          </p>
        ) : (
          items.map(({ client, report }) => (
            <Link
              key={client.id}
              href={`/dashboard/apis/${client.slug}`}
              className="rounded-3xl border border-border bg-white px-5 py-5 shadow-[0_12px_30px_rgba(16,16,36,0.04)] transition hover:border-primary/30"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-foreground">{client.name}</p>
                  <p className="mt-1 text-sm text-muted">{report.siteUrl ?? "Sin sitio público"}</p>
                </div>
                <StatusPill ok={report.ok} />
              </div>
              <p className="mt-4 text-sm text-foreground">{report.summary}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export function ApiConnectionDetail({
  client,
  report,
  services,
  logs,
}: {
  client: ApiClientRecord;
  report: ConnectionReport;
  services: { name: string; slug: string }[];
  logs: { id: string; method: string; path: string; status: number; errorCode: string; createdAt: string }[];
}) {
  return (
    <div>
      <DashboardPageHeader
        icon="apis"
        eyebrow={client.slug}
        title={client.name}
        action={{ label: "Volver", href: "/dashboard/apis", icon: "back", variant: "secondary" }}
        trailing={<RecheckButton />}
      />

      <section className="mt-6 rounded-3xl border border-border bg-white px-5 py-5 shadow-[0_12px_30px_rgba(16,16,36,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-muted">{report.siteUrl ?? "Sin sitio público"}</p>
            <p className="mt-2 text-base text-foreground">{report.summary}</p>
          </div>
          <StatusPill ok={report.ok} />
        </div>
      </section>

      <section className="mt-4 rounded-3xl border border-border bg-white px-5 py-5">
        <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-primary">Comprobación</h2>
        <ul className="mt-4 divide-y divide-border">
          {report.checks.map((check) => (
            <li key={check.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{check.label}</p>
                <p className="mt-1 text-sm text-muted">{check.detail}</p>
              </div>
              <StatusPill ok={check.ok} />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-white px-5 py-5">
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-primary">Credencial</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-muted">Vista previa</dt>
              <dd className="font-medium text-foreground">{client.secretPreview || "Sin vista previa"}</dd>
            </div>
            <div>
              <dt className="text-muted">Último uso</dt>
              <dd className="font-medium text-foreground">{formatWhen(client.lastUsedAt)}</dd>
            </div>
            <div>
              <dt className="text-muted">Servicios</dt>
              <dd className="font-medium text-foreground">
                {services.length ? services.map((service) => service.name).join(", ") : "Todo el catálogo"}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Host de la API que usa el sitio</dt>
              <dd className="font-medium text-foreground">{report.health?.apiHost || "Sin informar"}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-3xl border border-border bg-white px-5 py-5">
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-primary">Últimas llamadas</h2>
          {logs.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Esta credencial todavía no ha llamado a la API.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {logs.map((log) => (
                <li key={log.id} className="text-sm">
                  <p className="font-medium text-foreground">
                    {log.method} {log.path} · {log.status}
                    {log.errorCode ? ` · ${log.errorCode}` : ""}
                  </p>
                  <p className="text-muted">{formatWhen(log.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
