import { Suspense } from "react";

import { DashboardDataError } from "@/components/admin/DashboardDataError";
import { SalesPageSkeleton } from "@/components/admin/dashboard-skeletons";
import { SalesDashboard } from "@/components/admin/SalesDashboard";
import { requireAdminSession } from "@/lib/auth";
import { listBusinesses } from "@/lib/clients/business-repository";
import { listCommercialClients } from "@/lib/clients/commercial-clients";
import type { BusinessProfile } from "@/lib/clients/business";
import { listClients } from "@/lib/clients/repository";
import type { ClientRecord } from "@/lib/clients/types";
import { listSales } from "@/lib/sales/repository";
import type { SaleRecord } from "@/lib/sales/types";

export const dynamic = "force-dynamic";

type SalesPageProps = {
  searchParams: Promise<{ clientId?: string }>;
};

export default function SalesPage({ searchParams }: SalesPageProps) {
  return (
    <Suspense fallback={<SalesPageSkeleton />}>
      <SalesPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function SalesPageContent({ searchParams }: SalesPageProps) {
  await requireAdminSession();
  const params = await searchParams;

  let sales: SaleRecord[] = [];
  let clients: ClientRecord[] = [];
  let businesses: BusinessProfile[] = [];
  let loadError = false;

  try {
    [sales, clients, businesses] = await Promise.all([listSales(), listClients(), listBusinesses()]);
  } catch (error) {
    console.error("[smartpro:dashboard:ventas] Error de conexión a la base de datos", error);
    loadError = true;
  }

  if (loadError) {
    return (
      <DashboardDataError
        icon="ventas"
        eyebrow="Gestión comercial"
        title="Ventas"
        message="No se pudieron cargar las ventas."
      />
    );
  }

  return <SalesDashboard initialSales={sales} accounts={listCommercialClients(clients, businesses)} initialClientId={params.clientId} />;
}
