"use client";

import Link from "next/link";
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ClientAccountForm } from "@/components/admin/ClientAccountForms";
import { ClientCrmBoard } from "@/components/admin/ClientCrmBoard";
import { DashboardPageHeader } from "@/components/admin/DashboardPageHeader";
import type { BusinessProfile } from "@/lib/clients/business";
import { listCommercialClients, personName } from "@/lib/clients/commercial-clients";
import { CLIENT_STATUSES, getAssignedExecutiveName, getClientStatusLabel, type ClientAssignedExecutive, type ClientCrmStage, type ClientRecord, type ClientStatus } from "@/lib/clients/types";

const statusStyles: Record<ClientStatus, string> = {
  POTENCIAL: "bg-amber-50 text-amber-800",
  ACTIVO: "bg-emerald-50 text-emerald-800",
  RECURRENTE: "bg-violet-50 text-violet-800",
  INACTIVO: "bg-slate-100 text-slate-700",
};

const collapsePreferenceEvent = "smartpro:crm-collapse-preference";

function subscribeToCollapsePreference(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener(collapsePreferenceEvent, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(collapsePreferenceEvent, notify);
  };
}

function readCollapsePreference(key: string) {
  try {
    return window.localStorage.getItem(key) ?? "[]";
  } catch {
    return "[]";
  }
}

function getDefaultCollapsePreference() {
  return "[]";
}

function parseCollapsedCards(snapshot: string) {
  try {
    const ids: unknown = JSON.parse(snapshot);
    return new Set<string>(Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : []);
  } catch {
    return new Set<string>();
  }
}

export function ClientsDashboard({ initialClients, initialBusinesses, assignable, preferenceKey, hasPaused }: {
  initialClients: ClientRecord[];
  initialBusinesses: BusinessProfile[];
  assignable: ClientAssignedExecutive[];
  preferenceKey: string;
  hasPaused: boolean;
}) {
  const router = useRouter();
  useEffect(() => {
    if (!hasPaused) return;
    const timer = window.setInterval(() => router.refresh(), 60_000);
    return () => window.clearInterval(timer);
  }, [hasPaused, router]);

  const [temporaryCollapsed, setTemporaryCollapsed] = useState<Set<string> | null>(null);
  const collapseSnapshot = useSyncExternalStore(
    subscribeToCollapsePreference,
    () => readCollapsePreference(preferenceKey),
    getDefaultCollapsePreference,
  );
  const savedCollapsed = useMemo(() => parseCollapsedCards(collapseSnapshot), [collapseSnapshot]);
  const collapsed = temporaryCollapsed ?? savedCollapsed;
  const [view, setView] = useState<"board" | "list">("board");
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [executive, setExecutive] = useState("");
  const [service, setService] = useState("");
  const [error, setError] = useState("");
  const [stages, setStages] = useState<Record<string, ClientCrmStage>>({});
  const [classifications, setClassifications] = useState<Record<string, ClientStatus>>({});
  const accounts = useMemo(() => listCommercialClients(initialClients, initialBusinesses), [initialClients, initialBusinesses]);
  const executives = new Map(assignable.map((person) => [person.id, getAssignedExecutiveName(person)]));
  const services = [...new Set(initialClients.map(({ interestServiceName }) => interestServiceName).filter(Boolean))].sort();
  const query = search.trim().toLowerCase();
  const visible = accounts.map((account) => ({
    ...account, crmStage: stages[account.id] ?? account.crmStage, status: classifications[account.id] ?? account.status,
  })).filter((account) =>
    (!status || account.status === status) &&
    (!query || [account.name, account.rut, ...account.contacts.flatMap((contact) =>
      [personName(contact), contact.email, contact.phone, contact.jobTitle])].join(" ").toLowerCase().includes(query)) &&
    (!executive || (account.kind === "business" ? account.responsible?.id === executive : account.contacts[0]?.assignedExecutiveId === executive)) &&
    (!service || account.contacts.some((contact) => contact.interestServiceName === service)));

  const allCollapsed = accounts.length > 0 && accounts.every(({ id }) => collapsed.has(id));
  function setCardsCollapsed(ids: string[], compact: boolean) {
    const next = new Set(temporaryCollapsed ?? parseCollapsedCards(readCollapsePreference(preferenceKey)));
    for (const id of ids) {
      if (compact) next.add(id);
      else next.delete(id);
    }

    try {
      window.localStorage.setItem(preferenceKey, JSON.stringify([...next]));
      setTemporaryCollapsed(null);
      window.dispatchEvent(new Event(collapsePreferenceEvent));
    } catch {
      setTemporaryCollapsed(next);
    }
  }

  async function changeStatus(key: string, value: ClientStatus) {
    setError("");
    const [kind, id] = key.split(":");
    const url = kind === "business" ? `/api/businesses/${encodeURIComponent(id)}/crm` : `/api/clients/${encodeURIComponent(id)}/status`;
    try {
      const response = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: value }) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? "No se pudo guardar el estado.");
      setClassifications((current) => ({ ...current, [key]: value }));
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo guardar el estado.");
    }
  }

  return (
    <div className={view === "board" ? "flex h-[max(34rem,calc(100dvh-6rem))] min-w-0 flex-col gap-4 sm:h-[max(34rem,calc(100dvh-7rem))] lg:h-[max(34rem,calc(100dvh-4rem))]" : "space-y-5"}>
      <div className="sticky top-16 z-20 -mt-4 shrink-0 pt-4 sm:-mt-6 sm:pt-6 lg:top-0 lg:-mt-8 lg:pt-8">
      <DashboardPageHeader icon="clientes" eyebrow="Gestión comercial" title="Clientes"
        action={{ label: "Nuevo cliente", onClick: () => setCreating(true) }}
        trailing={<p className="text-sm text-muted">{accounts.length} {accounts.length === 1 ? "cliente" : "clientes"}</p>} />
      </div>
      <div role="group" aria-label="Controles de clientes" className="flex shrink-0 flex-wrap items-center gap-2 rounded-2xl border border-border bg-white p-3">
        <input aria-label="Buscar cliente" placeholder="Buscar cliente, contacto o RUT" className="dashboard-field min-w-48 flex-1" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select aria-label="Filtrar por estado" className="dashboard-field w-auto" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Todos los estados</option>
          {CLIENT_STATUSES.map((entry) => <option key={entry} value={entry}>{getClientStatusLabel(entry)}</option>)}
        </select>
        <select aria-label="Filtrar por ejecutivo" className="dashboard-field w-auto" value={executive} onChange={(event) => setExecutive(event.target.value)}>
          <option value="">Todos los ejecutivos</option>
          {[...executives].map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <select aria-label="Filtrar por servicio" className="dashboard-field w-auto" value={service} onChange={(event) => setService(event.target.value)}>
          <option value="">Todos los servicios</option>
          {services.map((entry) => <option key={entry}>{entry}</option>)}
        </select>
        <div className="flex shrink-0 rounded-xl border border-border p-1">
          {(["board", "list"] as const).map((entry) => <button key={entry} type="button" aria-pressed={view === entry}
            onClick={() => setView(entry)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${view === entry ? "bg-primary/10 text-primary" : "text-muted"}`}>
            {entry === "board" ? "Tablero" : "Lista"}
          </button>)}
        </div>
        {view === "board" && <button type="button" disabled={!accounts.length}
          onClick={() => setCardsCollapsed(accounts.map(({ id }) => id), !allCollapsed)}
          aria-label={allCollapsed ? "Expandir todo el tablero" : "Minimizar todo el tablero"}
          title={allCollapsed ? "Expandir todo el tablero" : "Minimizar todo el tablero"}
          className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl border border-border px-2.5 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-50">
          {allCollapsed ? <ChevronsUpDown size={15} aria-hidden="true" /> : <ChevronsDownUp size={15} aria-hidden="true" />}
          {allCollapsed ? "Expandir todo" : "Minimizar todo"}
        </button>}
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {view === "board" ? <ClientCrmBoard clients={visible} collapsed={collapsed} onCollapse={setCardsCollapsed} assignable={assignable} statusStyles={statusStyles} onStatusChange={changeStatus}
        onMoved={(key, stage) => { if (key.startsWith("person:")) setStages((current) => ({ ...current, [key]: stage })); }} />
        : <div className="divide-y divide-border rounded-2xl border border-border bg-white">
          {visible.length === 0 && <p className="p-5 text-sm text-muted">Sin clientes para estos filtros.</p>}
          {visible.map((account) => <Link key={account.id} href={account.href} className="flex items-center justify-between gap-3 p-4 hover:bg-slate-50">
            <div><p className="font-semibold">{account.name}</p>
              <p className="text-sm text-muted">{account.contacts.length} {account.contacts.length === 1 ? "contacto" : "contactos"}{account.rut && ` · ${account.rut}`}</p></div>
            <span className={`rounded-full px-2.5 py-1 text-xs ${statusStyles[account.status]}`}>{getClientStatusLabel(account.status)}</span>
          </Link>)}
        </div>}
      {creating && <ClientAccountForm onClose={() => setCreating(false)} />}
    </div>
  );
}
