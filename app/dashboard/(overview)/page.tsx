import { BarChart3, ChevronRight, CreditCard, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { DashboardPageHeader } from "@/components/admin/DashboardPageHeader";
import { OverviewPageSkeleton } from "@/components/admin/dashboard-skeletons";
import { requireAdminSession } from "@/lib/auth";
import { formatCurrency } from "@/lib/orders/service";
import { getSalePaymentMethodLabel, SALE_PAYMENT_METHODS, type SalePaymentMethod } from "@/lib/sales/types";
import { getSalesSummary } from "@/lib/sales/repository";
import type { SalesSummary } from "@/lib/sales/summary";

export const dynamic = "force-dynamic";

export default function DashboardPage({ searchParams }: { searchParams: DashboardSearchParams }) {
  return (
    <Suspense fallback={<OverviewPageSkeleton />}>
      <DashboardOverview searchParams={searchParams} />
    </Suspense>
  );
}

const METHOD_ORDER: SalePaymentMethod[] = [...SALE_PAYMENT_METHODS];
const COMMERCIAL_ACTIVITY_METRICS = [
  "Cantidad de leads",
  "Cantidad de reuniones",
  "Cantidad de cotizaciones",
];
const COMMERCIAL_REPORTS = [
  { title: "Estadísticas comerciales", Icon: TrendingUp },
  { title: "Ranking de servicios más vendidos", Icon: BarChart3 },
];
const PROJECT_METRICS = [
  { label: "Activos", count: 0 },
  { label: "Vencidos", count: 0 },
  { label: "Cerrados", count: 0 },
];
const panelStyle = "min-w-0 rounded-2xl border border-violet-200 bg-white shadow-sm";
const metricLabelStyle = "text-xs font-semibold text-navy sm:text-sm";
const metricValueStyle = "mt-1 wrap-anywhere text-2xl font-bold leading-tight tracking-[-0.045em] tabular-nums sm:text-[1.75rem]";
const metricCellStyle = "min-w-0 px-2.5 py-3 sm:px-4 sm:py-4";
const summaryButtonStyle = "flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-semibold text-navy hover:bg-violet-50 focus-visible:-outline-offset-2 focus-visible:outline-primary sm:px-4 [&::-webkit-details-marker]:hidden";
const chevronStyle = "ml-auto size-4 shrink-0 text-primary transition-transform group-open:rotate-90 motion-reduce:transition-none";
const BUSINESS_TIME_ZONE = "America/Santiago";
const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat("es-CL", {
  month: "long",
  timeZone: "UTC",
});
const MONTHS = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: MONTH_LABEL_FORMATTER.format(new Date(Date.UTC(2026, index, 15))),
}));

type DashboardSearchParams = Promise<Record<string, string | string[] | undefined>>;

function currentBusinessPeriod() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
  };
}

function getSingleParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getMonthLabel(month: number, year: number) {
  const monthName = MONTH_LABEL_FORMATTER.format(new Date(Date.UTC(year, month - 1, 15)));
  return `${monthName} ${year}`;
}

async function DashboardOverview({ searchParams }: { searchParams: DashboardSearchParams }) {
  await requireAdminSession();

  const query = await searchParams;
  const currentPeriod = currentBusinessPeriod();
  const requestedMonth = Number(getSingleParam(query.month));
  const requestedYear = Number(getSingleParam(query.year));
  const month = Number.isInteger(requestedMonth) && requestedMonth >= 1 && requestedMonth <= 12
    ? requestedMonth
    : currentPeriod.month;
  const year = Number.isInteger(requestedYear) && requestedYear >= 2000 && requestedYear <= currentPeriod.year
    ? requestedYear
    : currentPeriod.year;
  const period = { month, year };
  const periodLabel = getMonthLabel(month, year);

  let summary: SalesSummary = {
    soldTotal: 0,
    soldMonth: 0,
    collectedMonth: 0,
    receivableTotal: 0,
    collectedByMethod: {},
    debtors: [],
  };

  try {
    summary = await getSalesSummary(period);
  } catch (error) {
    console.error("[smartpro:dashboard:overview] No se pudo cargar el resumen comercial", error);
  }

  const methodEntries = METHOD_ORDER.filter((method) => (summary.collectedByMethod[method] ?? 0) > 0).map((method) => ({
    method,
    amount: summary.collectedByMethod[method] ?? 0,
  }));

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        icon="dashboard"
        eyebrow="Gestión operativa"
        title="Resumen"
        wrapDesktop
        trailing={
          <form method="get" action="/dashboard" aria-label="Filtrar resumen por mes y año" className="flex flex-wrap items-end gap-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-muted">Mes</span>
              <select name="month" defaultValue={String(month)} className="dashboard-field min-w-32 py-2 text-sm">
                {MONTHS.map((entry) => (
                  <option key={entry.value} value={entry.value}>{entry.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-muted">Año</span>
              <select name="year" defaultValue={String(year)} className="dashboard-field min-w-24 py-2 text-sm">
                {Array.from({ length: Math.max(1, currentPeriod.year - 2000 + 1) }, (_, index) => currentPeriod.year - index).map((optionYear) => (
                  <option key={optionYear} value={optionYear}>{optionYear}</option>
                ))}
              </select>
            </label>
            <button type="submit" className="min-h-10 rounded-full bg-gradient-to-r from-primary to-magenta px-4 text-sm font-semibold text-white">
              Ver periodo
            </button>
          </form>
        }
      />

      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-4">
        <section aria-label="Indicadores del resumen" className="min-w-0 space-y-3">
          <div className={`${panelStyle} px-1 sm:px-3`}>
            <dl className="grid grid-cols-3 divide-x divide-violet-100">
              <div className={metricCellStyle}>
                <dt className={metricLabelStyle}>Ventas<span className="sr-only"> · {periodLabel}</span></dt>
                <dd className={`${metricValueStyle} text-primary`}>{formatCurrency(summary.soldMonth)}</dd>
              </div>
              <div className={metricCellStyle}>
                <dt className={metricLabelStyle}>Cobrado<span className="sr-only"> · {periodLabel}</span></dt>
                <dd className={`${metricValueStyle} text-emerald-800`}>{formatCurrency(summary.collectedMonth)}</dd>
              </div>
              <div className={metricCellStyle}>
                <dt className={metricLabelStyle}>Por cobrar</dt>
                <dd className={`${metricValueStyle} text-amber-800`}>{formatCurrency(summary.receivableTotal)}</dd>
              </div>
            </dl>

            <dl className="grid grid-cols-3 divide-x divide-violet-100 border-t border-violet-100">
              {COMMERCIAL_ACTIVITY_METRICS.map((label) => (
                <div key={label} className={metricCellStyle}>
                  <dt className={metricLabelStyle}>{label}</dt>
                  <dd className={`${metricValueStyle} text-muted`}>
                    <span aria-hidden="true">—</span><span className="sr-only">Pendiente de activación</span>
                  </dd>
                </div>
              ))}
            </dl>

            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] divide-x divide-violet-100 border-t border-violet-100">
              <dl className={metricCellStyle}>
                <dt className={metricLabelStyle}>Tasas de conversión</dt>
                <dd className={`${metricValueStyle} text-muted`}>
                  <span aria-hidden="true">—</span><span className="sr-only">Pendiente de activación</span>
                </dd>
              </dl>
              <section aria-labelledby="overview-projects" className={metricCellStyle}>
                <h2 id="overview-projects" className={metricLabelStyle}>Proyectos</h2>
                <dl className="mt-1.5 grid grid-cols-3 gap-1 sm:gap-2">
                  {PROJECT_METRICS.map(({ label, count }) => (
                    <div key={label} className="min-w-0">
                      <dt className="wrap-anywhere text-[11px] text-muted sm:text-xs">{label}</dt>
                      <dd className="mt-0.5 text-lg font-bold leading-tight text-navy tabular-nums sm:text-xl">{count}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            </div>
          </div>

          <div className={`${panelStyle} grid divide-y divide-violet-100 sm:grid-cols-2 sm:items-start sm:divide-x sm:divide-y-0`}>
            <details name="overview-finance-details" className="group min-w-0">
              <summary className={`${summaryButtonStyle} rounded-t-2xl sm:rounded-tr-none sm:rounded-l-2xl`}>
                <CreditCard aria-hidden="true" size={18} className="shrink-0 text-primary" />
                <span>Medios de pago</span>
                <ChevronRight aria-hidden="true" className={chevronStyle} />
              </summary>
              <div className="border-t border-violet-100 px-3 py-3 text-sm sm:px-4">
                {methodEntries.length === 0 ? (
                  <p className="text-muted">Aún no hay cobros registrados en {periodLabel}.</p>
                ) : (
                  <ul className="space-y-2">
                    {methodEntries.map((entry) => (
                      <li key={entry.method} className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                        <span>{getSalePaymentMethodLabel(entry.method)}</span>
                        <span className="font-semibold tabular-nums">{formatCurrency(entry.amount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </details>

            <details name="overview-finance-details" className="group min-w-0">
              <summary className={`${summaryButtonStyle} rounded-b-2xl group-open:rounded-b-none sm:rounded-r-2xl sm:rounded-bl-none`}>
                <Users aria-hidden="true" size={18} className="shrink-0 text-primary" />
                <span>Clientes con saldo</span>
                <ChevronRight aria-hidden="true" className={chevronStyle} />
              </summary>
              <div className="border-t border-violet-100 px-3 py-3 text-sm sm:px-4">
                {summary.debtors.length === 0 ? (
                  <p className="text-muted">Nadie tiene saldo pendiente.</p>
                ) : (
                  <ul className="divide-y divide-violet-100">
                    {summary.debtors.slice(0, 8).map((debtor) => (
                      <li key={debtor.accountId} className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 py-2 first:pt-0">
                        <div className="min-w-0 wrap-anywhere">
                          <Link href={`/dashboard/ventas?clientId=${encodeURIComponent(debtor.accountId)}`} className="font-semibold hover:text-primary">
                            {debtor.clientCompany}
                          </Link>
                          <p className="text-xs text-muted">
                            {debtor.clientName} · {debtor.saleCount} {debtor.saleCount === 1 ? "venta" : "ventas"}
                          </p>
                        </div>
                        <p className="font-semibold tabular-nums">{formatCurrency(debtor.balanceDue)}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <Link href="/dashboard/ventas" className="mt-2 inline-flex min-h-8 items-center font-semibold text-primary hover:underline">
                  Ver ventas
                </Link>
              </div>
            </details>
          </div>
        </section>

        <section aria-label="Reportes comerciales" className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {COMMERCIAL_REPORTS.map(({ title, Icon }) => (
            <article key={title} className={`${panelStyle} p-4`}>
              <h2 className="text-base font-bold tracking-tight text-navy">{title}</h2>
              <div className="mt-3 flex min-h-13 items-center gap-2.5 rounded-xl bg-violet-50 px-3 py-2.5 lg:min-h-20">
                <Icon aria-hidden="true" size={20} className="shrink-0 text-primary" />
                <p className="text-sm text-muted">Pendiente de activación</p>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
