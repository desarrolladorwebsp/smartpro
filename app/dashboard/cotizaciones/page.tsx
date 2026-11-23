import { Suspense } from "react";

import { DashboardDataError } from "@/components/admin/DashboardDataError";
import { QuotesPageSkeleton } from "@/components/admin/dashboard-skeletons";
import { QuotesDashboard } from "@/components/admin/QuotesDashboard";
import { requireAdminSession } from "@/lib/auth";
import { listBusinesses } from "@/lib/clients/business-repository";
import { listCommercialClients } from "@/lib/clients/commercial-clients";
import type { BusinessProfile } from "@/lib/clients/business";
import { listClients } from "@/lib/clients/repository";
import { getPrismaClient } from "@/lib/db";
import type { ClientRecord } from "@/lib/clients/types";
import { listQuotes } from "@/lib/quotes/repository";
import type { QuoteRecord } from "@/lib/quotes/types";

export const dynamic = "force-dynamic";

type QuotesPageProps = {
  searchParams: Promise<{ clientId?: string | string[]; nueva?: string | string[] }>;
};

export default function QuotesPage({ searchParams }: QuotesPageProps) {
  return (
    <Suspense fallback={<QuotesPageSkeleton />}>
      <QuotesPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function QuotesPageContent({ searchParams }: QuotesPageProps) {
  const session = await requireAdminSession();
  const params = await searchParams;

  let quotes: QuoteRecord[] = [];
  let clients: ClientRecord[] = [];
  let businesses: BusinessProfile[] = [];
  let loadError = false;

  try {
    [quotes, clients, businesses] = await Promise.all([listQuotes(), listClients(), listBusinesses()]);
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

  const emails = [...new Set([session.email, ...quotes.map((quote) => quote.createdByEmail)]
    .map((email) => email.trim().toLowerCase()).filter(Boolean))];
  const authors = await getPrismaClient()?.user.findMany({
    where: { email: { in: emails } },
    select: { email: true, firstName: true, lastName: true },
  }).catch(() => []);
  const authorNames = Object.fromEntries((authors ?? []).map((author) => [
    author.email.trim().toLowerCase(),
    [author.firstName, author.lastName].map((part) => part?.trim()).filter(Boolean).join(" "),
  ]));

  const accounts = listCommercialClients(clients, businesses);
  const initialClientId = typeof params.clientId === "string" ? params.clientId : undefined;
  const initialCreateOpen = params.nueva === "1" && accounts.some(({ id }) => id === initialClientId);

  return <QuotesDashboard key={initialClientId} initialQuotes={quotes} accounts={accounts}
    initialClientId={initialClientId} initialCreateOpen={initialCreateOpen} authorNames={authorNames} />;
}
