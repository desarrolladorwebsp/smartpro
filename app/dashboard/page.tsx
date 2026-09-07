import { DashboardPageHeader } from "@/components/admin/DashboardPageHeader";
import { requireAdminSession } from "@/lib/auth";

export default async function DashboardPage() {
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
          <p className="mt-3 text-3xl font-bold tracking-[-0.05em] text-foreground">—</p>
        </div>

        <div className="rounded-[24px] border border-border bg-white p-5 shadow-[0_12px_30px_rgba(16,16,36,0.04)]">
          <p className="text-sm text-muted">Pagadas</p>
          <p className="mt-3 text-3xl font-bold tracking-[-0.05em] text-foreground">—</p>
        </div>

        <div className="rounded-[24px] border border-border bg-white p-5 shadow-[0_12px_30px_rgba(16,16,36,0.04)]">
          <p className="text-sm text-muted">Pendientes</p>
          <p className="mt-3 text-3xl font-bold tracking-[-0.05em] text-foreground">—</p>
        </div>
      </div>
    </div>
  );
}
