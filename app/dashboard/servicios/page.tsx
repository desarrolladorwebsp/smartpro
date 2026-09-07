import { ServicesDashboard } from "@/components/admin/ServicesDashboard";
import { DashboardPageHeader } from "@/components/admin/DashboardPageHeader";
import { requireAdminSession } from "@/lib/auth";
import { getCatalogTree } from "@/lib/services/repository";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  await requireAdminSession();

  try {
    const tree = await getCatalogTree();
    return <ServicesDashboard initialTree={tree} />;
  } catch (error) {
    console.error("[smartpro:dashboard:servicios] Error de conexión a la base de datos", error);
    return (
      <div className="space-y-6">
        <DashboardPageHeader icon="servicios" eyebrow="Catálogo de servicios" title="Servicios" />
        <div className="rounded-[24px] border border-dashed border-border bg-white p-8 text-center shadow-[0_12px_30px_rgba(16,16,36,0.04)]">
          <p className="text-sm font-semibold text-foreground">No se pudo conectar a la base de datos.</p>
          <p className="mt-2 text-sm text-muted">Intenta nuevamente en unos minutos. Si el problema persiste, contacta al equipo técnico.</p>
        </div>
      </div>
    );
  }
}
