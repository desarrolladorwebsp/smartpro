"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { DashboardPageHeader } from "@/components/admin/DashboardPageHeader";
import { DashboardEmptyState } from "@/components/admin/DashboardEmptyState";
import { DashboardSuccessToast } from "@/components/admin/DashboardSuccessToast";
import { QuoteCreateModal } from "@/components/admin/QuoteCreateModal";
import type { ClientRecord } from "@/lib/clients/types";
import { formatCurrency } from "@/lib/orders/service";
import {
  QUOTE_STATUSES,
  getQuoteStatusLabel,
  type QuoteRecord,
  type QuoteStatus,
} from "@/lib/quotes/types";

const statusStyles: Record<QuoteStatus, string> = {
  DRAFT: "bg-slate-200 text-slate-700",
  CREATED: "bg-sky-100 text-sky-700",
  SENT: "bg-violet-100 text-violet-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

type QuotesDashboardProps = {
  initialQuotes: QuoteRecord[];
  clients: ClientRecord[];
  initialClientId?: string;
};

export function QuotesDashboard({ initialQuotes, clients, initialClientId }: QuotesDashboardProps) {
  const [quotes, setQuotes] = useState(initialQuotes);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "ALL">("ALL");
  const [clientFilter, setClientFilter] = useState(initialClientId || "ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const dismissSuccess = useCallback(() => setSuccessMessage(""), []);

  const filteredQuotes = useMemo(() => {
    const query = search.trim().toLowerCase();
    const fromDate = from ? new Date(`${from}T00:00:00`) : null;
    const toDate = to ? new Date(`${to}T23:59:59`) : null;

    return quotes.filter((quote) => {
      const matchesSearch =
        !query ||
        [quote.number, quote.clientCompany, quote.clientName, quote.clientEmail, quote.notes]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesStatus = statusFilter === "ALL" || quote.status === statusFilter;
      const matchesClient = clientFilter === "ALL" || quote.clientId === clientFilter;
      const created = new Date(quote.createdAt);
      const matchesFrom = !fromDate || created >= fromDate;
      const matchesTo = !toDate || created <= toDate;
      return matchesSearch && matchesStatus && matchesClient && matchesFrom && matchesTo;
    });
  }, [quotes, search, statusFilter, clientFilter, from, to]);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        icon="cotizaciones"
        eyebrow="Gestión comercial"
        title="Cotizaciones"
        action={{ label: "Nueva cotización", onClick: () => setIsCreateOpen(true), icon: "plus" }}
        trailing={
          <p className="text-sm font-semibold text-muted">
            {quotes.length} {quotes.length === 1 ? "cotización" : "cotizaciones"}
          </p>
        }
      />

      <div className="rounded-[24px] border border-border bg-white p-4 shadow-[0_18px_46px_rgba(16,16,36,0.04)] sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="dashboard-field md:col-span-2 xl:col-span-1"
            placeholder="Buscar número, cliente o correo"
          />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as QuoteStatus | "ALL")} className="dashboard-field">
            <option value="ALL">Todos los estados</option>
            {QUOTE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {getQuoteStatusLabel(status)}
              </option>
            ))}
          </select>
          <select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)} className="dashboard-field">
            <option value="ALL">Todos los clientes</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.companyName}
              </option>
            ))}
          </select>
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="dashboard-field" aria-label="Desde" />
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="dashboard-field" aria-label="Hasta" />
        </div>
      </div>

      {quotes.length === 0 ? (
        <DashboardEmptyState
          title="No hay cotizaciones registradas"
          description="Crea una cotización desde un cliente o con el botón Nueva cotización."
          action={{ label: "Nueva cotización", onClick: () => setIsCreateOpen(true) }}
        />
      ) : filteredQuotes.length === 0 ? (
        <DashboardEmptyState
          title="Sin resultados"
          description="No hay cotizaciones con los filtros seleccionados."
        />
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-border bg-white shadow-[0_18px_46px_rgba(16,16,36,0.04)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-foreground">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.18em] text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Número</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Vence</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="border-t border-border">
                    <td className="px-4 py-3 font-semibold">{quote.number}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{quote.clientCompany}</div>
                      <div className="text-xs text-muted">{quote.clientName}</div>
                    </td>
                    <td className="px-4 py-3">{formatDate(quote.createdAt)}</td>
                    <td className="px-4 py-3">{formatDate(quote.validUntil)}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(quote.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[quote.status]}`}>
                        {getQuoteStatusLabel(quote.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/cotizaciones/${quote.id}`} className="inline-flex min-h-10 items-center justify-center rounded-full border border-border px-3 text-xs font-semibold">
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <QuoteCreateModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        clients={clients}
        onCreated={(quote) => {
          setQuotes((current) => [quote, ...current.filter((entry) => entry.id !== quote.id)]);
          setSearch("");
          setStatusFilter("ALL");
          setClientFilter("ALL");
          setFrom("");
          setTo("");
          setSuccessMessage(`Cotización ${quote.number} creada correctamente.`);
        }}
      />
      {successMessage ? <DashboardSuccessToast message={successMessage} onDismiss={dismissSuccess} /> : null}
    </div>
  );
}
