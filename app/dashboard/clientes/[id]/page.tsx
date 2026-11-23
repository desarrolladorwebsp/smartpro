import { ClientCrmHistory } from "@/components/admin/ClientCrmHistory";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";

import { ClientDetailView } from "@/components/admin/ClientDetailView";
import { DashboardDataError } from "@/components/admin/DashboardDataError";
import { ClientDetailPageSkeleton } from "@/components/admin/dashboard-skeletons";
import { requireAdminSession } from "@/lib/auth";
import { getClientById, listClientNotes } from "@/lib/clients/repository";
import type { ClientNoteRecord } from "@/lib/clients/repository";
import type { ClientRecord } from "@/lib/clients/types";
import { listAssignableExecutives } from "@/lib/executives/repository";
import type { ExecutiveRecord } from "@/lib/executives/types";
import { listQuotesByClientId } from "@/lib/quotes/repository";
import { listSales } from "@/lib/sales/repository";
import type { SaleRecord } from "@/lib/sales/types";
import type { QuoteRecord } from "@/lib/quotes/types";

export const dynamic = "force-dynamic";

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<ClientDetailPageSkeleton />}>
      <ClientDetailContent params={params} />
    </Suspense>
  );
}

async function ClientDetailContent({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  const { id } = await params;

  let client: ClientRecord | null = null;
  let clientNotes: ClientNoteRecord[] = [];
  let clientQuotes: QuoteRecord[] = [];
  let executives: ExecutiveRecord[] = [];
  let sales: SaleRecord[] = [];
  let loadError = false;

  try {
    client = await getClientById(id, { visibleOnly: true });

    if (client) {
      [clientNotes, clientQuotes, executives, sales] = await Promise.all([
        listClientNotes(client.id),
        listQuotesByClientId(client.id),
        listAssignableExecutives(),
        listSales({ contactId: client.id }),
      ]);
    }
  } catch (error) {
    console.error("[smartpro:dashboard:clientes:detalle] Error de conexión a la base de datos", error);
    loadError = true;
  }

  if (loadError) {
    return (
      <DashboardDataError
        icon="clientes"
        eyebrow="Clientes"
        title="Detalle"
        message="No se pudo cargar la ficha del cliente."
      />
    );
  }

  if (!client) {
    return (
      <div className="space-y-5">
        <Link href="/dashboard/clientes" className="inline-flex items-center gap-2 text-sm font-medium text-primary">
          <ArrowLeft size={15} />
          Volver a clientes
        </Link>
        <div className="rounded-[24px] border border-dashed border-border bg-white p-8 text-center text-sm text-muted shadow-[0_14px_36px_rgba(16,16,36,0.04)]">
          Cliente no encontrado.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
    <ClientDetailView
      initialClient={client}
      executives={executives}
      initialQuotes={clientQuotes}
      notes={clientNotes}
      sales={sales}
    />
    <ClientCrmHistory accountId={client.businessId ?? null} clientId={client.id} />
    </div>
  );
}
