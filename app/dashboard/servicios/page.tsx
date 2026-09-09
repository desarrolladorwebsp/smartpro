import { Suspense } from "react";

import { ServicesDashboard } from "@/components/admin/ServicesDashboard";
import { DashboardDataError } from "@/components/admin/DashboardDataError";
import { ServicesPageSkeleton } from "@/components/admin/dashboard-skeletons";
import { requireAdminSession } from "@/lib/auth";
import { parseCatalogView } from "@/lib/services/catalog-table";
import { getCatalogTree } from "@/lib/services/repository";
import type { CatalogTree } from "@/lib/services/types";

export const dynamic = "force-dynamic";

type ServicesPageProps = {
  searchParams: Promise<{ vista?: string | string[] }>;
};

export default function ServicesPage({ searchParams }: ServicesPageProps) {
  return (
    <Suspense fallback={<ServicesPageSkeleton />}>
      <ServicesPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ServicesPageContent({ searchParams }: ServicesPageProps) {
  await requireAdminSession();

  let tree: CatalogTree = [];
  let loadError = false;
  const params = await searchParams;
  const vista = Array.isArray(params.vista) ? params.vista[0] : params.vista;

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

  return <ServicesDashboard initialTree={tree} initialView={parseCatalogView(vista)} />;
}
