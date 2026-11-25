"use client";

import { ChevronDown, ChevronsDownUp, ChevronsUpDown, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ClientAccountForm } from "@/components/admin/ClientAccountForms";
import { ClientCrmBoard } from "@/components/admin/ClientCrmBoard";
import { CalendarSlotDialog } from "@/components/admin/CalendarSlotDialog";
import { ClientQuickView } from "@/components/admin/ClientQuickView";
import { DashboardSuccessToast } from "@/components/admin/DashboardSuccessToast";
import { NotificationCenter } from "@/components/admin/NotificationCenter";
import type { BusinessProfile } from "@/lib/clients/business";
import { listCommercialClients, personName } from "@/lib/clients/commercial-clients";
import type { CrmQuoteIndicator } from "@/lib/clients/quote-crm";
import { CLIENT_STATUSES, CRM_COLUMNS, DEFAULT_CRM_STAGES, getAssignedExecutiveName, getClientStatusLabel, type ClientAssignedExecutive, type ClientCrmStage, type ClientRecord, type ClientStatus, type CrmColumn } from "@/lib/clients/types";

const statusStyles: Record<ClientStatus, string> = {
  POTENCIAL: "bg-amber-50 text-amber-800",
  ACTIVO: "bg-emerald-50 text-emerald-800",
  RECURRENTE: "bg-violet-50 text-violet-800",
  INACTIVO: "bg-slate-100 text-slate-700",
};

const collapsePreferenceEvent = "smartpro:crm-collapse-preference";
const defaultColumns = DEFAULT_CRM_STAGES.map(({ id }) => id);

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

export function ClientsDashboard({ initialClients, initialBusinesses, quoteIndicators, contactedWithUnsentQuotes, assignable, preferenceKey, hasPaused, calendarDate, zoomConfigured }: {
  initialClients: ClientRecord[];
  initialBusinesses: BusinessProfile[];
  quoteIndicators: Record<string, CrmQuoteIndicator>;
  contactedWithUnsentQuotes: string[];
  assignable: ClientAssignedExecutive[];
  preferenceKey: string;
  hasPaused: boolean;
  calendarDate: string;
  zoomConfigured: boolean;
}) {
  const router = useRouter();
  const quoteResult = useSearchParams().get("cotizacion");
  const quoteMessage = quoteResult === "enviada" ? "Cotización enviada al cliente."
    : quoteResult === "guardada" ? "Cotización guardada en la ficha del cliente." : "";
  const dismissQuoteMessage = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("cotizacion");
    window.history.replaceState(null, "", url);
  }, []);
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
  const [view, setView] = useState<"board" | "list" | "archived">("board");
  const [creating, setCreating] = useState(false);
  const [openClientId, setOpenClientId] = useState<string | null>(null);
  const [scheduleClientId, setScheduleClientId] = useState<string | null>(null);
  const [scheduleMessage, setScheduleMessage] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [executive, setExecutive] = useState("");
  const [service, setService] = useState("");
  const [selectedColumns, setSelectedColumns] = useState(() => new Set<CrmColumn>(defaultColumns));
  const columns = CRM_COLUMNS.filter(({ id }) => selectedColumns.has(id));
  const customColumns = view === "board" && (selectedColumns.size !== defaultColumns.length || defaultColumns.some((id) => !selectedColumns.has(id)));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersId = useId();
  const filtersMenu = useRef<HTMLDivElement>(null);
  const filtersTrigger = useRef<HTMLButtonElement>(null);
  const activeFilterCount = [status, executive, service, customColumns].filter(Boolean).length;

  useEffect(() => {
    if (!filtersOpen) return;
    function closeOutside(event: PointerEvent) {
      if (!filtersMenu.current?.contains(event.target as Node)) setFiltersOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [filtersOpen]);
  const [error, setError] = useState("");
  const [stages, setStages] = useState<Record<string, ClientCrmStage>>({});
  const [classifications, setClassifications] = useState<Record<string, ClientStatus>>({});
  const allAccounts = useMemo(() => listCommercialClients(initialClients, initialBusinesses), [initialClients, initialBusinesses]);
  const accounts = allAccounts.map((account) => ({
    ...account, crmStage: stages[account.id] ?? account.crmStage, status: classifications[account.id] ?? account.status,
  })).filter((account) => view === "board" ? selectedColumns.has(account.crmArchiveState ?? account.crmStage) : Boolean(account.crmArchiveState) === (view === "archived"));
  const executives = new Map(assignable.map((person) => [person.id, getAssignedExecutiveName(person)]));
  const services = [...new Set(initialClients.map(({ interestServiceName }) => interestServiceName).filter(Boolean))].sort();
  const query = search.trim().toLowerCase();
  const visible = accounts.filter((account) =>
    (!status || account.status === status) &&
    (!query || [account.name, account.rut, ...account.contacts.flatMap((contact) =>
      [personName(contact), contact.email, contact.phone, contact.jobTitle])].join(" ").toLowerCase().includes(query)) &&
    (!executive || (account.kind === "business" ? account.responsible?.id === executive : account.contacts[0]?.assignedExecutiveId === executive)) &&
    (!service || account.contacts.some((contact) => contact.interestServiceName === service)));

  const openClient = visible.find(({ id }) => id === openClientId);
  function openScheduler(clientId: string) {
    setOpenClientId(null);
    setScheduleMessage("");
    setScheduleClientId(clientId);
  }

  const collapsible = accounts.filter((account) => !account.crmArchiveState);
  const allCollapsed = collapsible.length > 0 && collapsible.every(({ id }) => collapsed.has(id));
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
    <div className={`flex min-w-0 flex-col gap-4 ${view === "board" ? "lg:h-[max(36rem,calc(100dvh-4rem))]" : ""}`}>
      {quoteMessage && <DashboardSuccessToast message={quoteMessage} onDismiss={dismissQuoteMessage} />}
      <header className="sticky top-16 z-20 -mx-4 grid min-h-14 shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 bg-[#f7f7fb] px-4 py-1.5 sm:-mx-6 sm:px-6 lg:top-0 lg:mx-0 lg:px-0 xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:gap-3 2xl:min-h-15 2xl:gap-4">
        <h1 className="min-w-0 text-3xl font-bold tracking-[-0.05em] text-navy sm:text-4xl 2xl:text-[2.65rem]">Clientes</h1>
        <div role="group" aria-label="Controles de clientes" className="relative z-10 order-last col-span-2 flex min-w-0 flex-wrap items-center gap-2 rounded-2xl border border-border bg-white p-2 shadow-sm xl:order-none xl:col-span-1 xl:flex-nowrap">
          <div className="relative min-w-36 flex-1 xl:min-w-28">
            <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input aria-label="Buscar cliente" placeholder="Buscar cliente, contacto o RUT" className="dashboard-field h-10 rounded-xl pl-9 2xl:h-11 2xl:text-base"
              value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>

          <div ref={filtersMenu} className="relative shrink-0 max-sm:ml-auto" onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setFiltersOpen(false);
          }} onKeyDown={(event) => {
            if (event.key !== "Escape" || !filtersOpen) return;
            event.stopPropagation();
            setFiltersOpen(false);
            filtersTrigger.current?.focus();
          }}>
            <button ref={filtersTrigger} type="button" aria-expanded={filtersOpen} aria-controls={filtersId}
              onClick={() => setFiltersOpen((value) => !value)}
              className={`inline-flex h-10 items-center gap-1.5 rounded-xl border border-border px-2.5 text-sm font-semibold hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-primary sm:px-3 2xl:h-11 ${filtersOpen || activeFilterCount ? "bg-primary/10 text-primary" : "bg-white text-foreground"}`}>
              <SlidersHorizontal size={16} aria-hidden="true" /> Filtros
              {activeFilterCount > 0 && <span className="tabular-nums">({activeFilterCount})</span>}
              <ChevronDown size={14} aria-hidden="true" />
            </button>
            <div id={filtersId} hidden={!filtersOpen} className="absolute right-0 top-full z-30 mt-2 max-h-[min(36rem,55dvh)] w-[min(17rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-border bg-white p-3 shadow-lg sm:left-0 sm:right-auto">
              <div className="space-y-2.5">
                <label className="block text-xs font-semibold text-muted">Estado
                  <select aria-label="Filtrar por estado" className="dashboard-field mt-1 rounded-xl" value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="">Todos los estados</option>
                    {CLIENT_STATUSES.map((entry) => <option key={entry} value={entry}>{getClientStatusLabel(entry)}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-muted">Ejecutivo
                  <select aria-label="Filtrar por ejecutivo" className="dashboard-field mt-1 rounded-xl" value={executive} onChange={(event) => setExecutive(event.target.value)}>
                    <option value="">Todos los ejecutivos</option>
                    {[...executives].map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-muted">Servicio
                  <select aria-label="Filtrar por servicio" className="dashboard-field mt-1 rounded-xl" value={service} onChange={(event) => setService(event.target.value)}>
                    <option value="">Todos los servicios</option>
                    {services.map((entry) => <option key={entry}>{entry}</option>)}
                  </select>
                </label>
                {view === "board" && <fieldset className="border-t border-border pt-1.5">
                  <legend className="pr-2 text-xs font-semibold text-muted">Columnas visibles</legend>
                  <button type="button" className="min-h-8 text-xs font-semibold text-primary hover:underline"
                    onClick={() => setSelectedColumns(new Set(selectedColumns.size === CRM_COLUMNS.length ? defaultColumns : CRM_COLUMNS.map(({ id }) => id)))}>
                    {selectedColumns.size === CRM_COLUMNS.length ? "Restaurar columnas predeterminadas" : "Mostrar todas las columnas"}
                  </button>
                  {CRM_COLUMNS.map(({ id, label }) => <label key={id} className="flex min-h-8 items-center gap-2 text-sm">
                    <input type="checkbox" className="size-4 accent-primary" checked={selectedColumns.has(id)}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setSelectedColumns((current) => {
                          const next = new Set(current);
                          if (checked) next.add(id);
                          else next.delete(id);
                          return next;
                        });
                      }} />
                    {label}
                  </label>)}
                </fieldset>}
                {activeFilterCount > 0 && <button type="button" className="min-h-9 text-sm font-semibold text-primary hover:underline"
                  onClick={() => { setStatus(""); setExecutive(""); setService(""); if (view === "board") setSelectedColumns(new Set(defaultColumns)); filtersTrigger.current?.focus(); }}>Limpiar filtros</button>}
              </div>
            </div>
          </div>

          <div className="flex basis-full items-center gap-1.5 sm:basis-auto xl:shrink-0">
            <div role="group" aria-label="Vista de clientes" className="flex min-w-0 flex-1 items-center rounded-xl border border-border p-0.5 sm:flex-none">
              {(["board", "list", "archived"] as const).map((entry) => <button key={entry} type="button" aria-pressed={view === entry}
                onClick={() => setView(entry)} className={`min-h-9 flex-1 rounded-lg px-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-primary sm:flex-none sm:px-3 2xl:min-h-10 ${view === entry ? "bg-primary/10 text-primary" : "text-muted hover:bg-slate-50 hover:text-foreground"}`}>
                {entry === "board" ? "Tablero" : entry === "list" ? "Lista" : "Archivados"}
              </button>)}
            </div>
            {view === "board" && <button type="button" disabled={!collapsible.length}
              onClick={() => setCardsCollapsed(collapsible.map(({ id }) => id), !allCollapsed)}
              aria-label={allCollapsed ? "Expandir todo el tablero" : "Minimizar todo el tablero"}
              title={allCollapsed ? "Expandir todo" : "Minimizar todo"}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold text-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50">
              {allCollapsed ? <ChevronsUpDown size={17} aria-hidden="true" /> : <ChevronsDownUp size={17} aria-hidden="true" />}
              <span className="hidden whitespace-nowrap sm:max-xl:inline min-[1400px]:inline">{allCollapsed ? "Expandir todo" : "Minimizar todo"}</span>
            </button>}
          </div>
        </div>
        <div className="relative z-20 flex items-center gap-2 sm:gap-3">
          <span className="sr-only">{accounts.length} {accounts.length === 1 ? "cliente" : "clientes"}</span>
          <NotificationCenter />
          <button type="button" onClick={() => setCreating(true)}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-[#7b25d1] px-3 text-sm font-semibold text-white hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:px-4">
            <Plus size={16} aria-hidden="true" /> Nuevo cliente
          </button>
        </div>
      </header>
      {scheduleMessage && <p role="status" className="shrink-0 text-sm font-medium text-emerald-700">{scheduleMessage}</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {view === "board" ? <ClientCrmBoard clients={visible} columns={columns} quoteIndicators={quoteIndicators} contactedWithUnsentQuotes={contactedWithUnsentQuotes} collapsed={collapsed} onCollapse={setCardsCollapsed} assignable={assignable} statusStyles={statusStyles} onStatusChange={changeStatus} onOpenClient={setOpenClientId} onSchedule={openScheduler}
        onMoved={(key, stage) => { if (key.startsWith("person:")) setStages((current) => ({ ...current, [key]: stage })); }} />
        : <div className="divide-y divide-border rounded-2xl border border-border bg-white">
          {visible.length === 0 && <p className="p-5 text-sm text-muted">Sin clientes para estos filtros.</p>}
          {visible.map((account) => <button key={account.id} type="button" onClick={() => setOpenClientId(account.id)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary">
            <div><p className="font-semibold">{account.name}</p>
              <p className="text-sm text-muted">{account.contacts.length} {account.contacts.length === 1 ? "contacto" : "contactos"}{account.rut && ` · ${account.rut}`}</p></div>
            <span className={`rounded-full px-2.5 py-1 text-xs ${statusStyles[account.status]}`}>{account.crmArchiveState === "PAUSED" ? "En pausa" : account.crmArchiveState === "LOST" ? "Perdido" : getClientStatusLabel(account.status)}</span>
          </button>)}
        </div>}
      {openClient && <ClientQuickView key={openClient.id} client={openClient} onClose={() => setOpenClientId(null)}
        onSchedule={() => openScheduler(openClient.id)} />}
      {scheduleClientId && <CalendarSlotDialog key={scheduleClientId} date={calendarDate} initialClientKey={scheduleClientId}
        zoomConfigured={zoomConfigured}
        participants={assignable.map((person) => ({ id: person.id, name: getAssignedExecutiveName(person) }))}
        clients={allAccounts.map(({ id, name, contacts }) => ({
          id, name, contacts: contacts.map((contact) => ({ id: contact.id, name: personName(contact) || "Contacto sin nombre", email: contact.email })),
        }))}
        onContactAdded={() => router.refresh()}
        onClose={() => setScheduleClientId(null)}
        onSaved={() => {
          setScheduleMessage("Recordatorio guardado en el calendario.");
          setScheduleClientId(null);
        }} />}
      {creating && <ClientAccountForm onClose={() => setCreating(false)} />}
    </div>
  );
}
