import { Suspense } from "react";

import { DashboardPageHeader } from "@/components/admin/DashboardPageHeader";
import { OverviewPageSkeleton } from "@/components/admin/dashboard-skeletons";
import { requireAdminSession } from "@/lib/auth";

export default function DashboardPage() {
  return (
    <Suspense fallback={<OverviewPageSkeleton />}>
      <DashboardOverview />
    </Suspense>
  );
}

async function DashboardOverview() {
  await requireAdminSession();

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
          <p className="mt-3 text-3xl font-bold tracking-[-0.05em] text-foreground">0</p>
        </div>

        <div className="rounded-[24px] border border-border bg-white p-5 shadow-[0_12px_30px_rgba(16,16,36,0.04)]">
          <p className="text-sm text-muted">Ventas del mes</p>
          <p className="mt-3 text-3xl font-bold tracking-[-0.05em] text-foreground">0</p>

        </div>
        <div className="rounded-[24px] border border-border bg-white p-5 shadow-[0_12px_30px_rgba(16,16,36,0.04)]">
          <p className="text-sm text-muted">Cuentas por cobrar </p>
          <p className="mt-3 text-3xl font-bold tracking-[-0.05em] text-foreground">0</p>
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
    </div>
  );
}
