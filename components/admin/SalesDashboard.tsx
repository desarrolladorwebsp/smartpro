"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { DashboardPageHeader } from "@/components/admin/DashboardPageHeader";
import { DashboardEmptyState } from "@/components/admin/DashboardEmptyState";
import { DashboardSuccessToast } from "@/components/admin/DashboardSuccessToast";
import { SaleCreateModal } from "@/components/admin/SaleCreateModal";
import { SalePaymentModal } from "@/components/admin/SalePaymentModal";
import type { ClientRecord } from "@/lib/clients/types";
import { formatCurrency } from "@/lib/orders/service";
import { summarizeFilteredSales } from "@/lib/sales/summary";
import {
  getSaleCollectionStatusLabel,
  getSalePaymentMethodLabel,
  getSaleStatusLabel,
  SALE_STATUSES,
  type SaleCollectionStatus,
  type SaleRecord,
  type SaleStatus,
} from "@/lib/sales/types";

const statusStyles: Record<SaleStatus, string> = {
  REGISTERED: "bg-sky-100 text-sky-700",
  IN_PROGRESS: "bg-violet-100 text-violet-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-rose-100 text-rose-700",
};

const collectionStyles: Record<SaleCollectionStatus, string> = {
  UNPAID: "bg-rose-100 text-rose-700",
  PARTIAL: "bg-amber-100 text-amber-800",
  PAID: "bg-emerald-100 text-emerald-700",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

type SalesDashboardProps = {
  initialSales: SaleRecord[];
  clients: ClientRecord[];
  initialClientId?: string;
};

export function SalesDashboard({ initialSales, clients: initialClients, initialClientId }: SalesDashboardProps) {
  const [sales, setSales] = useState(initialSales);
  const [clients, setClients] = useState(initialClients);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SaleStatus | "ALL">("ALL");
  const [collectionFilter, setCollectionFilter] = useState<"ALL" | "DUE">("ALL");
  const [clientFilter, setClientFilter] = useState(initialClientId || "ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [paymentSale, setPaymentSale] = useState<SaleRecord | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const dismissSuccess = useCallback(() => setSuccessMessage(""), []);
  const closeCreate = useCallback(() => setIsCreateOpen(false), []);
  const closePayment = useCallback(() => setPaymentSale(null), []);

  const refreshSales = useCallback(async () => {
    try {
      const [salesResponse, clientsResponse] = await Promise.all([
        fetch("/api/sales", { cache: "no-store" }),
        fetch("/api/clients", { cache: "no-store" }),
      ]);

      if (salesResponse.ok) {
        const data = (await salesResponse.json()) as { sales?: SaleRecord[] };
        if (Array.isArray(data.sales)) {
          setSales(data.sales);
        }
      }

      if (clientsResponse.ok) {
        const data = (await clientsResponse.json()) as { clients?: ClientRecord[] };
        if (Array.isArray(data.clients)) {
          setClients(data.clients);
        }
      }
    } catch {
      // Keep the last successful snapshot visible.
    }
  }, []);

  useEffect(() => {
    const onFocus = () => {
      void refreshSales();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refreshSales]);

  const filteredSales = useMemo(() => {
    const query = search.trim().toLowerCase();
    const fromDate = from ? new Date(`${from}T00:00:00`) : null;
    const toDate = to ? new Date(`${to}T23:59:59`) : null;

    return sales.filter((sale) => {
      const matchesSearch =
        !query ||
        [sale.number, sale.clientCompany, sale.clientName, sale.quoteNumber, sale.orderId, sale.executiveName, sale.observation]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesStatus = statusFilter === "ALL" || sale.status === statusFilter;
      const matchesCollection = collectionFilter === "ALL" || (sale.status !== "CANCELLED" && sale.balanceDue > 0);
      const matchesClient = clientFilter === "ALL" || sale.clientId === clientFilter;
      const soldAt = new Date(sale.soldAt);
      const matchesFrom = !fromDate || soldAt >= fromDate;
      const matchesTo = !toDate || soldAt <= toDate;
      return matchesSearch && matchesStatus && matchesCollection && matchesClient && matchesFrom && matchesTo;
    });
  }, [sales, search, statusFilter, collectionFilter, clientFilter, from, to]);

  const listTotals = useMemo(() => summarizeFilteredSales(filteredSales), [filteredSales]);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        icon="ventas"
        eyebrow="Gestión comercial"
        title="Ventas"
        action={{ label: "Nueva venta", onClick: () => setIsCreateOpen(true), icon: "plus" }}
        trailing={
          <p className="text-sm font-semibold text-muted">
            {sales.length} {sales.length === 1 ? "venta" : "ventas"}
          </p>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[20px] border border-border bg-white p-4">
          <p className="text-xs text-muted">Vendido</p>
          <p className="mt-1 text-xl font-bold tracking-[-0.04em]">{formatCurrency(listTotals.sold)}</p>
        </div>
        <div className="rounded-[20px] border border-border bg-white p-4">
          <p className="text-xs text-muted">Cobrado</p>
          <p className="mt-1 text-xl font-bold tracking-[-0.04em]">{formatCurrency(listTotals.collected)}</p>
        </div>
        <div className="rounded-[20px] border border-border bg-white p-4">
          <p className="text-xs text-muted">Por cobrar</p>
          <p className="mt-1 text-xl font-bold tracking-[-0.04em]">{formatCurrency(listTotals.receivable)}</p>
        </div>
      </div>

      <div className="rounded-[24px] border border-border bg-white p-4 shadow-[0_18px_46px_rgba(16,16,36,0.04)] sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="dashboard-field md:col-span-2 xl:col-span-1"
            placeholder="Buscar número, cliente o cotización"
          />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as SaleStatus | "ALL")} className="dashboard-field">
            <option value="ALL">Todos los estados</option>
            {SALE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {getSaleStatusLabel(status)}
              </option>
            ))}
          </select>
          <select value={collectionFilter} onChange={(event) => setCollectionFilter(event.target.value as "ALL" | "DUE")} className="dashboard-field">
            <option value="ALL">Todos los cobros</option>
            <option value="DUE">Con saldo</option>
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

      {sales.length === 0 ? (
        <DashboardEmptyState
          title="No hay ventas registradas"
          description="Los pagos aprobados se registran aquí automáticamente. También puedes convertir una cotización con Nueva venta."
          action={{ label: "Nueva venta", onClick: () => setIsCreateOpen(true) }}
        />
      ) : filteredSales.length === 0 ? (
        <DashboardEmptyState title="Sin resultados" description="No hay ventas con los filtros seleccionados." />
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-border bg-white shadow-[0_18px_46px_rgba(16,16,36,0.04)]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-foreground">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.18em] text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Número</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Cotización / Orden</th>
                  <th className="px-4 py-3 font-medium">Pago</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Pagado</th>
                  <th className="px-4 py-3 font-medium">Saldo</th>
                  <th className="px-4 py-3 font-medium">Cobro</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Comprobante</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="border-t border-border">
                    <td className="px-4 py-3 font-semibold">{sale.number}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{sale.clientCompany}</div>
                      <div className="text-xs text-muted">{sale.clientName}</div>
                    </td>
                    <td className="px-4 py-3">
                      {sale.quoteId && sale.quoteNumber ? (
                        <Link href={`/dashboard/cotizaciones/${sale.quoteId}`} className="font-medium text-primary hover:underline">
                          {sale.quoteNumber}
                        </Link>
                      ) : sale.orderId ? (
                        <Link href={`/dashboard/compras/${sale.orderId}`} className="font-medium text-primary hover:underline">
                          {sale.orderId}
                        </Link>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{getSalePaymentMethodLabel(sale.paymentMethod)}</td>
                    <td className="px-4 py-3">{formatDate(sale.soldAt)}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(sale.total)}</td>
                    <td className="px-4 py-3">{formatCurrency(sale.paidAmount)}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(sale.balanceDue)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${collectionStyles[sale.collectionStatus]}`}>
                        {getSaleCollectionStatusLabel(sale.collectionStatus)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[sale.status]}`}>
                        {getSaleStatusLabel(sale.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {sale.receiptPath ? (
                        <a
                          href={sale.receiptPath}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-10 items-center justify-center rounded-full border border-border px-3 text-xs font-semibold"
                        >
                          Ver archivo
                        </a>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {sale.status !== "CANCELLED" && sale.balanceDue > 0 ? (
                        <button
                          type="button"
                          onClick={() => setPaymentSale(sale)}
                          className="inline-flex min-h-10 items-center justify-center rounded-full border border-border px-3 text-xs font-semibold hover:border-primary/30 hover:text-primary"
                        >
                          Abono
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <SaleCreateModal
        open={isCreateOpen}
        onClose={closeCreate}
        clients={clients}
        onCreated={(sale) => {
          setSales((current) => [sale, ...current.filter((entry) => entry.id !== sale.id)]);
          setSearch("");
          setStatusFilter("ALL");
          setClientFilter("ALL");
          setFrom("");
          setTo("");
          setSuccessMessage(`Venta ${sale.number} registrada correctamente.`);
          void refreshSales();
        }}
      />
      <SalePaymentModal
        sale={paymentSale}
        onClose={closePayment}
        onSaved={(sale) => {
          setSales((current) => current.map((entry) => (entry.id === sale.id ? sale : entry)));
          setSuccessMessage(`Abono registrado en ${sale.number}.`);
          void refreshSales();
        }}
      />
      {successMessage ? <DashboardSuccessToast message={successMessage} onDismiss={dismissSuccess} /> : null}
    </div>
  );
}
