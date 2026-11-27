"use client";

import { ChevronDown, ChevronsDownUp, ChevronsUpDown, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ClientAccountForm } from "@/components/admin/ClientAccountForms";
import { ClientCrmBoard } from "@/components/admin/ClientCrmBoard";
import { CalendarSlotDialog } from "@/components/admin/CalendarSlotDialog";
import { ClientQuickView } from "@/components/admin/ClientQuickView";
import { ClientServiceIcons } from "@/components/admin/ClientServiceInterests";
import { ClientStageSelect } from "@/components/admin/ClientStageSelect";
import { DashboardSuccessToast } from "@/components/admin/DashboardSuccessToast";
import { DashboardFormActions, DashboardFormFooter, DashboardFormModal } from "@/components/admin/dashboard-form";
import { NotificationCenter } from "@/components/admin/NotificationCenter";
import { useClientBoardPreferences } from "@/components/admin/useClientBoardPreferences";
import { defaultBoardDisplay, moveClientCardInOrder, orderClientCards, type BoardDisplay, type ClientBoardPreferences } from "@/lib/clients/board-preferences";
import type { BusinessProfile } from "@/lib/clients/business";
import { listCommercialClients, parseCommercialClientId, personName, type CommercialClient } from "@/lib/clients/commercial-clients";
import { crmArchiveLabel } from "@/lib/clients/crm-archive";
import type { CrmQuoteIndicator } from "@/lib/clients/quote-crm";
import { CLIENT_SERVICE_INTERESTS, clientServiceInterestFromName } from "@/lib/clients/service-interests";
import { CLIENT_STATUSES, CRM_COLUMNS, CRM_STAGES, getAssignedExecutiveName, getClientStatusLabel, type ClientAssignedExecutive, type ClientCrmStage, type ClientRecord, type ClientStatus, type CrmColumn } from "@/lib/clients/types";

const statusStyles: Record<ClientStatus, string> = {
  POTENCIAL: "bg-amber-50 text-amber-800",
  ACTIVO: "bg-emerald-50 text-emerald-800",
  RECURRENTE: "bg-violet-50 text-violet-800",
  INACTIVO: "bg-slate-100 text-slate-700",
};

const defaultColumns = defaultBoardDisplay.columns;

function toggleFilter<T extends string>(values: T[], value: T) {
  return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
}

function ClientFilterGroup<T extends string>({ label, options, selected, onToggle }: {
  label: string;
  options: ReadonlyArray<readonly [T, string]>;
  selected: readonly T[];
  onToggle: (value: T) => void;
}) {
  if (!options.length) return null;
  return <details className="rounded-xl border border-border px-2.5">
    <summary className="min-h-9 cursor-pointer py-2 text-sm font-semibold">
      {label}{selected.length > 0 && <span className="ml-1 text-primary">({selected.length})</span>}
    </summary>
    <fieldset aria-label={label} className="max-h-32 overflow-y-auto pb-1">
      {options.map(([value, name]) => <label key={value} className="flex min-h-8 items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 shrink-0 accent-primary" checked={selected.includes(value)} onChange={() => onToggle(value)} />
        <span className="min-w-0 break-words">{name}</span>
      </label>)}
    </fieldset>
  </details>;
}

export function ClientsDashboard({ initialClients, initialBusinesses, quoteIndicators, contactedWithUnsentQuotes, assignable, preferenceKey, userId, initialPreferences, hasPaused, calendarDate, zoomConfigured }: {
  initialClients: ClientRecord[];
  initialBusinesses: BusinessProfile[];
  quoteIndicators: Record<string, CrmQuoteIndicator>;
  contactedWithUnsentQuotes: string[];
  assignable: ClientAssignedExecutive[];
  preferenceKey: string;
  userId: string;
  initialPreferences: ClientBoardPreferences;
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

  const { preferences, current, update, saveFailed, retry } = useClientBoardPreferences(initialPreferences, userId, preferenceKey);
  const { view, statuses } = preferences.display;
  const selectedColumns = new Set(preferences.display.columns);
  const collapsed = new Set(preferences.collapsed);
  function setDisplay(patch: Partial<BoardDisplay>) {
    update({ display: { ...current.current.display, ...patch } });
  }
  const [creating, setCreating] = useState(false);
  const [openClientId, setOpenClientId] = useState<string | null>(null);
  const [scheduleClientId, setScheduleClientId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [archiveMove, setArchiveMove] = useState<{ client: CommercialClient; stage: (typeof CRM_STAGES)[number] } | null>(null);
  const [savingArchiveMove, setSavingArchiveMove] = useState(false);
  const [archiveMoveError, setArchiveMoveError] = useState("");
  const archiveMoveTrigger = useRef<HTMLElement | null>(null);
  const focusArchiveMove = useCallback((form: HTMLFormElement | null) => {
    form?.querySelector<HTMLButtonElement>('button[type="button"]')?.focus();
  }, []);
  const [search, setSearch] = useState("");
  const executives = new Map(assignable.map((person) => [person.id, getAssignedExecutiveName(person)]));
  const legacyServices = [...new Set(initialClients.map(({ interestServiceName }) => interestServiceName)
    .filter((name) => name && !clientServiceInterestFromName(name)))].sort((a, b) => a.localeCompare(b, "es-CL"));
  const services = [...Object.values(CLIENT_SERVICE_INTERESTS), ...legacyServices];
  const selectedExecutives = preferences.display.executives.filter((id) => executives.has(id));
  const selectedServices = [...new Set(preferences.display.services.flatMap((value) => {
    const interest = clientServiceInterestFromName(value);
    return interest ? [CLIENT_SERVICE_INTERESTS[interest]] : legacyServices.includes(value) ? [value] : [];
  }))];
  const selectedServiceInterests = selectedServices.map((service) => ({ service, interest: clientServiceInterestFromName(service) }));
  const columns = CRM_COLUMNS.filter(({ id }) => selectedColumns.has(id));
  const customColumns = view === "board" && (selectedColumns.size !== defaultColumns.length || defaultColumns.some((id) => !selectedColumns.has(id)));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersId = useId();
  const filtersMenu = useRef<HTMLDivElement>(null);
  const filtersTrigger = useRef<HTMLButtonElement>(null);
  const activeFilterCount = [statuses.length, selectedExecutives.length, selectedServices.length, customColumns].filter(Boolean).length;

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
  const currentAccounts = allAccounts.map((account) => ({
    ...account, crmStage: stages[account.id] ?? account.crmStage, status: classifications[account.id] ?? account.status,
  }));
  const accounts = currentAccounts.filter((account) => view === "board" ? selectedColumns.has(account.crmArchiveState ?? account.crmStage) : Boolean(account.crmArchiveState) === (view === "archived"));
  const query = search.trim().toLowerCase();
  const visible = accounts.filter((account) =>
    (!statuses.length || statuses.includes(account.status)) &&
    (!query || [account.name, account.rut, ...account.contacts.flatMap((contact) =>
      [personName(contact), contact.email, contact.phone, contact.jobTitle])].join(" ").toLowerCase().includes(query)) &&
    (!selectedExecutives.length || selectedExecutives.includes((account.kind === "business" ? account.responsible?.id : account.contacts[0]?.assignedExecutiveId) ?? "")) &&
    (!selectedServiceInterests.length || selectedServiceInterests.some(({ service, interest }) => interest
      ? account.serviceInterests.includes(interest) : account.contacts.some((contact) => contact.interestServiceName === service))));

  const openClient = currentAccounts.find(({ id }) => id === openClientId);
  function openScheduler(clientId: string) {
    setOpenClientId(null);
    setSuccessMessage("");
    setScheduleClientId(clientId);
  }

  const collapsible = accounts.filter((account) => !account.crmArchiveState);
  const allCollapsed = collapsible.length > 0 && collapsible.every(({ id }) => collapsed.has(id));
  function setCardsCollapsed(ids: string[], compact: boolean) {
    const next = new Set(current.current.collapsed);
    for (const id of ids) {
      if (compact) next.add(id);
      else next.delete(id);
    }

    update({ collapsed: [...next] });
  }

  function reorderCard(column: CrmColumn, id: string, anchor: { key: string; after: boolean }) {
    const order = current.current.cardOrder;
    const cards = currentAccounts.filter((account) => (account.crmArchiveState ?? account.crmStage) === column);
    const ids = orderClientCards(cards, order[column]).map((account) => account.id);
    const next = moveClientCardInOrder(ids, id, anchor);
    if (next !== ids) update({ cardOrder: { ...order, [column]: next } });
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

  function selectArchivedDestination(client: CommercialClient, destination: CrmColumn) {
    const stage = CRM_STAGES.find(({ id }) => id === destination);
    if (!stage || client.crmArchiveState !== "ARCHIVED") return;
    archiveMoveTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSuccessMessage("");
    setArchiveMoveError("");
    setArchiveMove({ client, stage });
  }

  function closeArchiveMove() {
    if (savingArchiveMove) return;
    setArchiveMove(null);
    archiveMoveTrigger.current?.focus();
  }

  async function reactivateClient() {
    if (!archiveMove || savingArchiveMove) return;
    const { client, stage } = archiveMove;
    const target = parseCommercialClientId(client.id);
    if (!target) return;
    const id = encodeURIComponent(target.id);
    const url = target.kind === "business" ? `/api/businesses/${id}/crm` : `/api/clients/${id}/crm-stage`;
    setSavingArchiveMove(true);
    setArchiveMoveError("");
    try {
      const response = await fetch(url, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crmStage: stage.id, reactivateFrom: client.crmArchiveState }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo reactivar al cliente.");
      }
      if (target.kind === "person") setStages((current) => {
        if (!(client.id in current)) return current;
        const next = { ...current };
        delete next[client.id];
        return next;
      });
      setArchiveMove(null);
      setSuccessMessage(`${client.name} se movió a «${stage.label}».`);
      router.refresh();
    } catch (error) {
      setArchiveMoveError(error instanceof Error ? error.message : "No se pudo reactivar al cliente.");
    } finally {
      setSavingArchiveMove(false);
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
                <ClientFilterGroup label="Estado" options={CLIENT_STATUSES.map((entry) => [entry, getClientStatusLabel(entry)])} selected={statuses}
                  onToggle={(entry) => setDisplay({ statuses: toggleFilter(current.current.display.statuses, entry) })} />
                <ClientFilterGroup label="Ejecutivo" options={[...executives]} selected={selectedExecutives}
                  onToggle={(entry) => setDisplay({ executives: toggleFilter(current.current.display.executives, entry) })} />
                <ClientFilterGroup label="Servicio" options={services.map((entry) => [entry, entry])} selected={selectedServices}
                  onToggle={(entry) => setDisplay({ services: toggleFilter(selectedServices, entry) })} />
                {view === "board" && <fieldset className="border-t border-border pt-1.5">
                  <legend className="pr-2 text-xs font-semibold text-muted">Columnas visibles</legend>
                  <button type="button" className="min-h-8 text-xs font-semibold text-primary hover:underline"
                    onClick={() => setDisplay({ columns: selectedColumns.size === CRM_COLUMNS.length ? defaultColumns : CRM_COLUMNS.map(({ id }) => id) })}>
                    {selectedColumns.size === CRM_COLUMNS.length ? "Restaurar columnas predeterminadas" : "Mostrar todas las columnas"}
                  </button>
                  {CRM_COLUMNS.map(({ id, label }) => <label key={id} className="flex min-h-8 items-center gap-2 text-sm">
                    <input type="checkbox" className="size-4 accent-primary" checked={selectedColumns.has(id)}
                      onChange={(event) => {
                        const next = new Set(current.current.display.columns);
                        if (event.target.checked) next.add(id);
                        else next.delete(id);
                        setDisplay({ columns: [...next] });
                      }} />
                    {label}
                  </label>)}
                </fieldset>}
                {activeFilterCount > 0 && <button type="button" className="min-h-9 text-sm font-semibold text-primary hover:underline"
                  onClick={() => { setDisplay({ statuses: [], executives: [], services: [], ...(view === "board" ? { columns: defaultColumns } : {}) }); filtersTrigger.current?.focus(); }}>Limpiar filtros</button>}
              </div>
            </div>
          </div>

          <div className="flex basis-full items-center gap-1.5 sm:basis-auto xl:shrink-0">
            <div role="group" aria-label="Vista de clientes" className="flex min-w-0 flex-1 items-center rounded-xl border border-border p-0.5 sm:flex-none">
              {(["board", "list", "archived"] as const).map((entry) => <button key={entry} type="button" aria-pressed={view === entry}
                onClick={() => setDisplay({ view: entry })} className={`min-h-9 flex-1 rounded-lg px-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-primary sm:flex-none sm:px-3 2xl:min-h-10 ${view === entry ? "bg-primary/10 text-primary" : "text-muted hover:bg-slate-50 hover:text-foreground"}`}>
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
      {successMessage && <p role="status" className="shrink-0 text-sm font-medium text-emerald-700">{successMessage}</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {saveFailed && <p role="alert" className="text-sm text-red-700">No se pudo guardar tu configuración.{" "}
        <button type="button" onClick={() => void retry()} className="font-semibold underline">Reintentar</button>
      </p>}
      {view === "board" ? <ClientCrmBoard clients={visible} columns={columns} cardOrder={preferences.cardOrder} onReorder={reorderCard} quoteIndicators={quoteIndicators} contactedWithUnsentQuotes={contactedWithUnsentQuotes} collapsed={collapsed} onCollapse={setCardsCollapsed} assignable={assignable} statusStyles={statusStyles} onStatusChange={changeStatus} onOpenClient={setOpenClientId} onSchedule={openScheduler} onReactivateArchived={selectArchivedDestination}
        onMoved={(key, stage) => { if (key.startsWith("person:")) setStages((current) => ({ ...current, [key]: stage })); }} />
        : <div className="divide-y divide-border rounded-2xl border border-border bg-white">
          {visible.length === 0 && <p className="p-5 text-sm text-muted">Sin clientes para estos filtros.</p>}
          {visible.map((account) => <div key={account.id} className="flex flex-wrap items-center">
            <button type="button" onClick={() => setOpenClientId(account.id)}
              aria-describedby={account.serviceInterests.length ? `${filtersId}-${account.id}-services` : undefined}
              className="flex min-w-48 flex-1 items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary">
              <div className="min-w-0 break-words"><div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-semibold">
                <span className="min-w-0">{account.name}</span>
                <ClientServiceIcons services={account.serviceInterests} descriptionId={`${filtersId}-${account.id}-services`} />
              </div>
                <p className="text-sm text-muted">{account.contacts.length} {account.contacts.length === 1 ? "contacto" : "contactos"}{account.rut && ` · ${account.rut}`}</p></div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${statusStyles[account.status]}`}>{crmArchiveLabel(account.crmArchiveState) ?? getClientStatusLabel(account.status)}</span>
            </button>
            {account.crmArchiveState === "ARCHIVED" && <div className="px-4 py-2">
              <ClientStageSelect name={account.name} currentStage={account.crmArchiveState} onSelect={(stage) => selectArchivedDestination(account, stage)} />
            </div>}
          </div>)}
        </div>}
      {archiveMove && <DashboardFormModal eyebrow="Clientes" title="Reactivar cliente" onClose={closeArchiveMove}>
        <form ref={focusArchiveMove} onKeyDown={(event) => { if (event.key === "Escape") closeArchiveMove(); }}
          onSubmit={(event) => { event.preventDefault(); void reactivateClient(); }}>
          <p className="break-words p-4 text-sm">¿Mover a <strong>{archiveMove.client.name}</strong> de «{crmArchiveLabel(archiveMove.client.crmArchiveState)}» a «{archiveMove.stage.label}»?</p>
          <DashboardFormFooter error={archiveMoveError}>
            <DashboardFormActions isSaving={savingArchiveMove} onCancel={closeArchiveMove} submitLabel="Confirmar cambio" />
          </DashboardFormFooter>
        </form>
      </DashboardFormModal>}
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
          setSuccessMessage("Recordatorio guardado en el calendario.");
          setScheduleClientId(null);
        }} />}
      {creating && <ClientAccountForm onClose={() => setCreating(false)} />}
    </div>
  );
}
