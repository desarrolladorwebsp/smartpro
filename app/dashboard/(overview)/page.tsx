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

export default function DashboardPage() {
  return (
    <Suspense fallback={<OverviewPageSkeleton />}>
      <DashboardOverview />
    </Suspense>
  );
}

const METHOD_ORDER: SalePaymentMethod[] = [...SALE_PAYMENT_METHODS];

async function DashboardOverview() {
  await requireAdminSession();

  let summary: SalesSummary = {
    soldTotal: 0,
    soldMonth: 0,
    collectedMonth: 0,
    receivableTotal: 0,
    collectedByMethod: {},
    debtors: [],
  };

  try {
    summary = await getSalesSummary();
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
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-border bg-white p-5 shadow-[0_12px_30px_rgba(16,16,36,0.04)]">
          <p className="text-sm text-muted">Ventas total</p>
          <p className="mt-3 text-3xl font-bold tracking-[-0.05em] text-foreground">{formatCurrency(summary.soldTotal)}</p>
        </div>

        <div className="rounded-[24px] border border-border bg-white p-5 shadow-[0_12px_30px_rgba(16,16,36,0.04)]">
          <p className="text-sm text-muted">Ventas del mes</p>
          <p className="mt-3 text-3xl font-bold tracking-[-0.05em] text-foreground">{formatCurrency(summary.soldMonth)}</p>
        </div>
        <div className="rounded-[24px] border border-border bg-white p-5 shadow-[0_12px_30px_rgba(16,16,36,0.04)]">
          <p className="text-sm text-muted">Cuentas por cobrar</p>
          <p className="mt-3 text-3xl font-bold tracking-[-0.05em] text-foreground">{formatCurrency(summary.receivableTotal)}</p>
        </div>

        <div className="rounded-[24px] border border-border bg-white p-5 shadow-[0_12px_30px_rgba(16,16,36,0.04)]">
          <p className="text-sm text-muted">Cobrado del mes</p>
          <p className="mt-3 text-3xl font-bold tracking-[-0.05em] text-foreground">{formatCurrency(summary.collectedMonth)}</p>
        </div>

        <div className="rounded-[24px] border border-border bg-white p-5 shadow-[0_12px_30px_rgba(16,16,36,0.04)] md:col-span-2">
          <p className="text-sm text-muted">Cómo nos pagaron este mes</p>
          {methodEntries.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Aún no hay cobros registrados este mes.</p>
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
