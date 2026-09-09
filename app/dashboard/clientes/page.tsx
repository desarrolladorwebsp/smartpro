import { Suspense } from "react";

import { requireAdminSession } from "@/lib/auth";
import { ClientsDashboard } from "@/components/admin/ClientsDashboard";
import { DashboardDataError } from "@/components/admin/DashboardDataError";
import { ClientsPageSkeleton } from "@/components/admin/dashboard-skeletons";
import { listClients } from "@/lib/clients/repository";
import type { ClientRecord } from "@/lib/clients/types";

export const dynamic = "force-dynamic";

export default function ClientsPage() {
  return (
    <Suspense fallback={<ClientsPageSkeleton />}>
      <ClientsPageContent />
    </Suspense>
  );
}

async function ClientsPageContent() {
  await requireAdminSession();

  let clients: ClientRecord[] = [];
  let loadError = false;

  try {
    clients = await listClients();
  } catch (error) {
    console.error("[smartpro:dashboard:clientes] Error de conexión a la base de datos", error);
    loadError = true;
  }

  if (loadError) {
    return (
      <DashboardDataError
        icon="clientes"
        eyebrow="Gestión de clientes"
        title="Clientes"
      />
    );
  }

  return <ClientsDashboard initialClients={clients} />;
}
