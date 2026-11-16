import { Suspense } from "react";
import { listAssignableExecutives } from "@/lib/executives/repository";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/auth";
import { ClientsDashboard } from "@/components/admin/ClientsDashboard";
import { DashboardDataError } from "@/components/admin/DashboardDataError";
import { ClientsPageSkeleton } from "@/components/admin/dashboard-skeletons";
import { listBusinesses } from "@/lib/clients/business-repository";
import type { BusinessProfile } from "@/lib/clients/business";
import { listClients } from "@/lib/clients/repository";
import { reactivatePausedCrmClients } from "@/lib/clients/crm-archive-repository";
import type { ClientRecord } from "@/lib/clients/types";

export const dynamic = "force-dynamic";

export default function ClientsPage({ searchParams }: { searchParams: Promise<{ empresa?: string }> }) {
  return (
    <Suspense fallback={<ClientsPageSkeleton />}>
      <ClientsPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ClientsPageContent({ searchParams }: { searchParams: Promise<{ empresa?: string }> }) {
  const session = await requireAdminSession();

  let clients: ClientRecord[] = [];
  let businesses: BusinessProfile[] = [];
  let executives: Awaited<ReturnType<typeof listAssignableExecutives>> = [];
  let loadError = false;

  try {
    await reactivatePausedCrmClients();
    [clients, businesses, executives] = await Promise.all([listClients(), listBusinesses(), listAssignableExecutives()]);
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

  const { empresa } = await searchParams;
  const businessId = businesses.find(({ id }) => id === empresa)?.id;
  if (businessId) redirect(`/dashboard/clientes/ficha/${encodeURIComponent(businessId)}`);
  const hasPaused = businesses.some((entry) => entry.crmArchiveState === "PAUSED") ||
    clients.some((entry) => !entry.businessId && entry.crmArchiveState === "PAUSED");
  return <ClientsDashboard
    preferenceKey={`smartpro:crm:collapsed:${session.email.trim().toLowerCase()}`}
    hasPaused={hasPaused}
    initialClients={clients.filter((entry) => entry.businessId || !entry.crmArchiveState)}
    initialBusinesses={businesses.filter((entry) => !entry.crmArchiveState)}
    assignable={executives.map(({ id, firstName, lastName, email }) => ({ id, firstName, lastName: lastName ?? "", email }))}
  />;
}
