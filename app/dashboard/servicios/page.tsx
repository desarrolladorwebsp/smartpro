import { Suspense } from "react";

import { ServicesDashboard } from "@/components/admin/ServicesDashboard";
import { DashboardDataError } from "@/components/admin/DashboardDataError";
import { ServicesPageSkeleton } from "@/components/admin/dashboard-skeletons";
import { requireAdminSession } from "@/lib/auth";
import { getCatalogTree } from "@/lib/services/repository";
import type { CatalogTree } from "@/lib/services/types";

export const dynamic = "force-dynamic";

export default function ServicesPage() {
  return (
    <Suspense fallback={<ServicesPageSkeleton />}>
      <ServicesPageContent />
    </Suspense>
  );
}

async function ServicesPageContent() {
  await requireAdminSession();

  let tree: CatalogTree = [];
  let loadError = false;

  try {
    tree = await getCatalogTree();
  } catch (error) {
    console.error("[smartpro:dashboard:servicios] Error de conexión a la base de datos", error);
    loadError = true;
  }

  if (loadError) {
    return (
      <DashboardDataError
        icon="servicios"
        eyebrow="Catálogo de servicios"
        title="Servicios"
      />
    );
  }

  return <ServicesDashboard initialTree={tree} />;
}
