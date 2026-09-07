import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/auth";
import { ExecutivesDashboard } from "@/components/admin/ExecutivesDashboard";
import { DashboardPageHeader } from "@/components/admin/DashboardPageHeader";
import { listExecutives } from "@/lib/executives/repository";

export const dynamic = "force-dynamic";

export default async function ExecutivesPage() {
  const session = await requireAdminSession();

  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  try {
    const executives = await listExecutives();
    return <ExecutivesDashboard initialExecutives={executives} />;
  } catch (error) {
    console.error("[smartpro:dashboard:ejecutivos] Error de conexión a la base de datos", error);
    return (
      <div className="space-y-6">
        <DashboardPageHeader icon="ejecutivos" eyebrow="Gestión de ejecutivos" title="Ejecutivos" />
        <div className="rounded-[24px] border border-dashed border-border bg-white p-8 text-center shadow-[0_12px_30px_rgba(16,16,36,0.04)]">
          <p className="text-sm font-semibold text-foreground">No se pudo conectar a la base de datos.</p>
          <p className="mt-2 text-sm text-muted">Intenta nuevamente en unos minutos. Si el problema persiste, contacta al equipo técnico.</p>
        </div>
      </div>
    );
  }
}
