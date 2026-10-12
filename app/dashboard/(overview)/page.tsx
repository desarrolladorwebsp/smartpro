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

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-border bg-white p-5 shadow-[0_12px_30px_rgba(16,16,36,0.04)]">
          <p className="text-sm text-muted">Ventas · {periodLabel}</p>
          <p className="mt-3 text-3xl font-bold tracking-[-0.05em] text-foreground">{formatCurrency(summary.soldMonth)}</p>
        </div>
        <div className="rounded-[24px] border border-border bg-white p-5 shadow-[0_12px_30px_rgba(16,16,36,0.04)]">
          <p className="text-sm text-muted">Cuentas por cobrar</p>
          <p className="mt-3 text-3xl font-bold tracking-[-0.05em] text-foreground">{formatCurrency(summary.receivableTotal)}</p>
        </div>

        <div className="rounded-[24px] border border-border bg-white p-5 shadow-[0_12px_30px_rgba(16,16,36,0.04)]">
          <p className="text-sm text-muted">Cobrado · {periodLabel}</p>
          <p className="mt-3 text-3xl font-bold tracking-[-0.05em] text-foreground">{formatCurrency(summary.collectedMonth)}</p>
        </div>

        <div className="rounded-[24px] border border-border bg-white p-5 shadow-[0_12px_30px_rgba(16,16,36,0.04)] md:col-span-2">
          <p className="text-sm text-muted">Medios de pago · {periodLabel}</p>
          {methodEntries.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Aún no hay cobros registrados en {periodLabel}.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {methodEntries.map((entry) => (
                <li key={entry.method} className="flex items-center justify-between gap-3">
                  <span>{getSalePaymentMethodLabel(entry.method)}</span>
                  <span className="font-semibold">{formatCurrency(entry.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-[24px] border border-border bg-white p-5 shadow-[0_12px_30px_rgba(16,16,36,0.04)]">
          <p className="text-sm text-muted">Proyectos activos</p>
          <p className="mt-3 text-3xl font-bold tracking-[-0.05em] text-foreground">0</p>
        </div>
        <div className="rounded-[24px] border border-border bg-white p-5 shadow-[0_12px_30px_rgba(16,16,36,0.04)]">
          <p className="text-sm text-muted">Proyectos vencidos</p>
          <p className="mt-3 text-3xl font-bold tracking-[-0.05em] text-foreground">0</p>
        </div>
        <div className="rounded-[24px] border border-border bg-white p-5 shadow-[0_12px_30px_rgba(16,16,36,0.04)]">
          <p className="text-sm text-muted">Proyectos cerrados</p>
          <p className="mt-3 text-3xl font-bold tracking-[-0.05em] text-foreground">0</p>
        </div>
      </div>

      <div className="rounded-[24px] border border-border bg-white p-5 shadow-[0_12px_30px_rgba(16,16,36,0.04)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted">Quién nos debe</p>
            <p className="mt-1 text-lg font-semibold tracking-[-0.04em]">Clientes con saldo</p>
          </div>
          <Link href="/dashboard/ventas" className="text-sm font-semibold text-primary hover:underline">
            Ver ventas
          </Link>
        </div>
        {summary.debtors.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Nadie tiene saldo pendiente.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {summary.debtors.slice(0, 8).map((debtor) => (
              <li key={debtor.clientId} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <Link href={`/dashboard/ventas?clientId=${encodeURIComponent(debtor.clientId)}`} className="font-semibold hover:text-primary">
                    {debtor.clientCompany}
                  </Link>
                  <p className="text-xs text-muted">
                    {debtor.clientName} · {debtor.saleCount} {debtor.saleCount === 1 ? "venta" : "ventas"}
                  </p>
                </div>
                <p className="font-semibold">{formatCurrency(debtor.balanceDue)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
