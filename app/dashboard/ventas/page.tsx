import { Suspense } from "react";
import { redirect } from "next/navigation";

import { DashboardDataError } from "@/components/admin/DashboardDataError";
import { SalesPageSkeleton } from "@/components/admin/dashboard-skeletons";
import { SalesDashboard } from "@/components/admin/SalesDashboard";
import { requireAdminSession } from "@/lib/auth";
import { listBusinesses } from "@/lib/clients/business-repository";
import { commercialClientId, listCommercialClients } from "@/lib/clients/commercial-clients";
import type { BusinessProfile } from "@/lib/clients/business";
import { listClients } from "@/lib/clients/repository";
import type { ClientRecord } from "@/lib/clients/types";
import { getQuoteById } from "@/lib/quotes/repository";
import type { QuoteRecord } from "@/lib/quotes/types";
import { listSaleCollectionSummaries } from "@/lib/sales/collection-repository";
import type { SaleCollectionSummary } from "@/lib/sales/collections";
import { getQuoteSaleConversionCheck } from "@/lib/sales/conversion";
import { getSaleByQuoteId, listSales } from "@/lib/sales/repository";
import type { QuoteForSaleConversion, SaleRecord } from "@/lib/sales/types";

export const dynamic = "force-dynamic";

type SalesPageProps = {
  searchParams: Promise<{ clientId?: string | string[]; cotizacion?: string | string[] }>;
};

export default function SalesPage({ searchParams }: SalesPageProps) {
  return (
    <Suspense fallback={<SalesPageSkeleton />}>
      <SalesPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function SalesPageContent({ searchParams }: SalesPageProps) {
  const session = await requireAdminSession();
  const params = await searchParams;
  const requestedQuoteId = typeof params.cotizacion === "string" ? params.cotizacion.trim() : "";

  let sales: SaleRecord[] = [];
  let clients: ClientRecord[] = [];
  let businesses: BusinessProfile[] = [];
  let collections: Record<string, SaleCollectionSummary> = {};
  let requestedQuote: QuoteRecord | null = null;
  let existingSale: SaleRecord | null = null;
  let loadError = false;

  try {
    [sales, clients, businesses, collections, requestedQuote, existingSale] = await Promise.all([
      listSales(), listClients(), listBusinesses(), listSaleCollectionSummaries(session),
      requestedQuoteId ? getQuoteById(requestedQuoteId) : null,
      requestedQuoteId ? getSaleByQuoteId(requestedQuoteId) : null,
    ]);
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

  const accounts = listCommercialClients(clients, businesses);
  let initialQuote: QuoteForSaleConversion | null = null;
  let quoteError = "";
  if (requestedQuoteId) {
    if (requestedQuote?.status !== "ACCEPTED") {
      quoteError = "Selecciona una cotización aceptada para cerrar la venta.";
    } else {
      const accountId = commercialClientId(requestedQuote.clientId, requestedQuote.businessId);
      const account = accounts.find((entry) => entry.id === accountId);
      if (existingSale) redirect(`/dashboard/ventas/${encodeURIComponent(existingSale.id)}?cobro=1`);
      if (!account?.contacts.some((contact) => contact.id === requestedQuote.clientId)) {
        quoteError = "El cliente o el contacto de esta cotización ya no está disponible.";
      } else {
        initialQuote = { quote: requestedQuote, ...getQuoteSaleConversionCheck(requestedQuote.status, false, "MANUAL", requestedQuote.proposal) };
      }
    }
  }

  return (
    <SalesDashboard
      key={requestedQuoteId}
      initialSales={sales}
      initialCollections={collections}
      accounts={accounts}
      initialClientId={typeof params.clientId === "string" ? params.clientId : undefined}
      initialQuote={initialQuote}
      quoteError={quoteError}
    />
  );
}
