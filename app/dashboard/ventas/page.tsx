import { Suspense } from "react";

import { DashboardDataError } from "@/components/admin/DashboardDataError";
import { SalesPageSkeleton } from "@/components/admin/dashboard-skeletons";
import { SalesDashboard } from "@/components/admin/SalesDashboard";
import { requireAdminSession } from "@/lib/auth";
import { listClients } from "@/lib/clients/repository";
import type { ClientRecord } from "@/lib/clients/types";
import { listSales } from "@/lib/sales/repository";
import type { SaleRecord } from "@/lib/sales/types";

export const dynamic = "force-dynamic";

export default function SalesPage() {
  return (
    <Suspense fallback={<SalesPageSkeleton />}>
      <SalesPageContent />
    </Suspense>
  );
}

async function SalesPageContent() {
  await requireAdminSession();

  let sales: SaleRecord[] = [];
  let clients: ClientRecord[] = [];
  let loadError = false;

  try {
    [sales, clients] = await Promise.all([listSales(), listClients()]);
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

  return <SalesDashboard initialSales={sales} clients={clients} />;
}
