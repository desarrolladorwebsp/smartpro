import { Suspense } from "react";

import { DashboardDataError } from "@/components/admin/DashboardDataError";
import { QuotesPageSkeleton } from "@/components/admin/dashboard-skeletons";
import { QuotesDashboard } from "@/components/admin/QuotesDashboard";
import { requireAdminSession } from "@/lib/auth";
import { listClients } from "@/lib/clients/repository";
import type { ClientRecord } from "@/lib/clients/types";
import { listQuotes } from "@/lib/quotes/repository";
import type { QuoteRecord } from "@/lib/quotes/types";

export const dynamic = "force-dynamic";

type QuotesPageProps = {
  searchParams: Promise<{ clientId?: string }>;
};

export default function QuotesPage({ searchParams }: QuotesPageProps) {
  return (
    <Suspense fallback={<QuotesPageSkeleton />}>
      <QuotesPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function QuotesPageContent({ searchParams }: QuotesPageProps) {
  await requireAdminSession();
  const params = await searchParams;

  let quotes: QuoteRecord[] = [];
  let clients: ClientRecord[] = [];
  let loadError = false;

  try {
    [quotes, clients] = await Promise.all([listQuotes(), listClients()]);
  } catch (error) {
    console.error("[smartpro:dashboard:cotizaciones] Error de conexión a la base de datos", error);
    loadError = true;
  }

  if (loadError) {
    return (
      <DashboardDataError
        icon="cotizaciones"
        eyebrow="Gestión comercial"
        title="Cotizaciones"
        message="No se pudieron cargar las cotizaciones."
      />
    );
  }

  return <QuotesDashboard initialQuotes={quotes} clients={clients} initialClientId={params.clientId} />;
}
