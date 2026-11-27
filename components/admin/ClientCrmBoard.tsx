"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { crmArchiveLabel, crmToday, isCrmArchiveState, parseReactivationDate, type CrmArchiveState } from "@/lib/clients/crm-archive";
import { orderClientCards, type BoardCardOrder } from "@/lib/clients/board-preferences";
import { parseCommercialClientId, personName, type CommercialClient } from "@/lib/clients/commercial-clients";
import { useId, useLayoutEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { BriefcaseBusiness, CalendarPlus, ChevronDown, ChevronUp, ChevronsDownUp, ChevronsUpDown, ContactRound, FileCheck2, FileText, GripVertical, StickyNote, UserRound } from "lucide-react";
import type { CrmQuoteIndicator } from "@/lib/clients/quote-crm";
import { clientServiceInterestFromName } from "@/lib/clients/service-interests";
import { CLIENT_STATUSES, CRM_STAGES, getAssignedExecutiveName, getClientStatusLabel, isClientStatus, type ClientAssignedExecutive, type ClientCrmStage, type ClientStatus, type CrmColumn } from "@/lib/clients/types";

import { DashboardFormActions, DashboardFormFooter, DashboardFormModal } from "@/components/admin/dashboard-form";
import { ClientQuoteDecisionDialog } from "@/components/admin/ClientQuoteDecisionDialog";
import { ClientStageSelect } from "@/components/admin/ClientStageSelect";
import { ClientServiceIcons } from "@/components/admin/ClientServiceInterests";

const colors: Record<CrmColumn, { accent: string; dot: string }> = {
  NEW: { accent: "border-t-blue-500", dot: "bg-blue-500" },
  CONTACTED: { accent: "border-t-amber-500", dot: "bg-amber-500" },
  QUOTED: { accent: "border-t-violet-600", dot: "bg-violet-600" },
  NEGOTIATION: { accent: "border-t-emerald-600", dot: "bg-emerald-600" },
  PROPOSAL_REJECTED: { accent: "border-t-rose-600", dot: "bg-rose-600" },
  LOST: { accent: "border-t-slate-500", dot: "bg-slate-500" },
  PAUSED: { accent: "border-t-sky-600", dot: "bg-sky-600" },
  ARCHIVED: { accent: "border-t-zinc-800", dot: "bg-zinc-800" },
};

const quoteTones = {
  green: "border-emerald-300 border-l-emerald-600 bg-emerald-50/70",
  yellow: "border-amber-300 border-l-amber-500 bg-amber-50/70",
  red: "border-rose-300 border-l-rose-600 bg-rose-50/70",
};

const quoteStyles: Record<CrmQuoteIndicator, { label: string; tone: keyof typeof quoteTones }> = {
  ACCEPTED: { label: "Cotización aceptada", tone: "green" },
  CURRENT: { label: "Cotización vigente", tone: "green" },
  EXPIRED: { label: "Cotización vencida", tone: "yellow" },
  REJECTED: { label: "Cotización rechazada", tone: "red" },
};

const quoteActionClassName = "col-span-full inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-primary focus-visible:outline-primary lg:min-h-9";

export function ClientCrmBoard({ clients, columns, cardOrder, onReorder, quoteIndicators, contactedWithUnsentQuotes, assignable, onMoved, onReactivateArchived, statusStyles, onStatusChange, collapsed, onCollapse, onOpenClient, onSchedule }: {
  clients: CommercialClient[];
  columns: ReadonlyArray<{ id: CrmColumn; label: string }>;
  cardOrder: BoardCardOrder;
  onReorder: (column: CrmColumn, id: string, anchor: { key: string; after: boolean }) => void;
  quoteIndicators: Record<string, CrmQuoteIndicator>;
  contactedWithUnsentQuotes: string[];
  collapsed: ReadonlySet<string>;
  onCollapse: (ids: string[], compact: boolean) => void;
  onOpenClient: (id: string) => void;
  onSchedule: (id: string) => void;
  assignable: ClientAssignedExecutive[];
  statusStyles: Record<ClientStatus, string>;
  onStatusChange: (id: string, status: ClientStatus) => Promise<void>;
  onMoved: (id: string, stage: ClientCrmStage) => void;
  onReactivateArchived: (client: CommercialClient, stage: CrmColumn) => void;
}) {
  const router = useRouter();
  const contactedQuoteKeys = new Set(contactedWithUnsentQuotes);
  const boardId = useId();
  const [insertion, setInsertion] = useState<{ key: string; after: boolean } | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [assigned, setAssigned] = useState<Record<string, string>>({});
  const [dragging, setDragging] = useState<CommercialClient | null>(null);
  const [target, setTarget] = useState<CrmColumn | null>(null);
  const [classifying, setClassifying] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ error: boolean; message: string } | null>(null);
  const [archive, setArchive] = useState<{ client: CommercialClient; state: CrmArchiveState } | null>(null);
  const [rejecting, setRejecting] = useState<{ client: CommercialClient; position?: { key: string; after: boolean } } | null>(null);
  const [noteClient, setNoteClient] = useState<CommercialClient | null>(null);
  const [quoteClient, setQuoteClient] = useState<CommercialClient | null>(null);
  const noteTrigger = useRef<HTMLButtonElement | null>(null);
  const saving = useRef(false);
  const draggedClient = useRef<CommercialClient | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const previousPositions = useRef<Map<string, DOMRect> | null>(null);
  const focusClient = useRef<string | null>(null);

  function changeStage(id: string, stage: ClientCrmStage) {
    previousPositions.current = new Map(
      Array.from(boardRef.current?.querySelectorAll<HTMLElement>("[data-client-id]") ?? [], (card) =>
        [card.dataset.clientId!, card.getBoundingClientRect()]),
    );
    onMoved(id, stage);
  }

  useLayoutEffect(() => {
    const positions = previousPositions.current;
    if (!positions) return;
    previousPositions.current = null;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cards = boardRef.current?.querySelectorAll<HTMLElement>("[data-client-id]") ?? [];
    const moved = focusClient.current;
    focusClient.current = null;
    // Read all positions before starting animations to avoid forcing layout per card.
    const motions = Array.from(cards, (card) => {
      const before = positions.get(card.dataset.clientId!);
      const after = card.getBoundingClientRect();
      return { card, x: before ? before.left - after.left : 0, y: before ? before.top - after.top : 0 };
    });
    for (const { card, x, y } of motions) {
      if (!reduceMotion && (x || y)) {
        card.animate([
          { transform: `translate(${x}px, ${y}px)`, zIndex: 1 },
          { transform: "translate(0, 0)", zIndex: 1 },
        ], { duration: 210, easing: "cubic-bezier(0.2, 0.75, 0.25, 1)" });
      }
      if (moved && card.dataset.clientId === moved && document.activeElement === document.body) {
        card.querySelector<HTMLElement>("[data-stage-control]")?.focus({ preventScroll: true });
      }
    }
  }, [clients]);
  function insertionAt(event: DragEvent<HTMLElement>, client: CommercialClient) {
    if (!(event.target instanceof Element)) return null;
    const card = event.target.closest<HTMLElement>("[data-client-id]");
    const key = card?.dataset.clientId;
    if (!card || !key || key === client.id) return null;
    const bounds = card.getBoundingClientRect();
    return { key, after: event.clientY >= bounds.top + bounds.height / 2 };
  }

  async function assign(client: CommercialClient, responsibleId: string) {
    const account = parseCommercialClientId(client.id)!;
    const id = encodeURIComponent(account.id);
    const url = account.kind === "business" ? `/api/businesses/${id}/crm` : `/api/clients/${id}/assign-executive`;
    setAssigning(client.id);
    setFeedback(null);
    try {
      const response = await fetch(url, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(account.kind === "business" ? { responsibleId: responsibleId || null } : { executiveId: responsibleId || null }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "No se pudo asignar el responsable.");
      setAssigned((current) => ({ ...current, [client.id]: responsibleId }));
      router.refresh();
      setFeedback({ error: false, message: `Responsable actualizado para ${client.name}.` });
    } catch (error) {
      setFeedback({ error: true, message: error instanceof Error ? error.message : "No se pudo asignar el responsable." });
    } finally {
      setAssigning(null);
    }
  }

  async function move(client: CommercialClient, stage: ClientCrmStage, restoreFocus = false, position?: { key: string; after: boolean }) {
    const originalStage = client.crmStage ?? "NEW";
    if (saving.current) return;
    if (originalStage === stage) {
      if (position) onReorder(stage, client.id, position);
      return;
    }

    saving.current = true;
    setPending(client.id);
    setFeedback(null);
    focusClient.current = restoreFocus ? client.id : null;
    changeStage(client.id, stage);

    try {
      const account = parseCommercialClientId(client.id)!;
      const id = encodeURIComponent(account.id);
      const url = account.kind === "business" ? `/api/businesses/${id}/crm` : `/api/clients/${id}/crm-stage`;
      const response = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crmStage: stage }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "No se pudo mover el cliente.");
      }
      if (position) onReorder(stage, client.id, position);
      if (account.kind === "business") router.refresh();
      const label = CRM_STAGES.find((entry) => entry.id === stage)?.label;
      setFeedback({ error: false, message: `${client.name} se movió a «${label}».` });
    } catch (error) {
      if (restoreFocus && document.activeElement?.closest("[data-client-id]")?.getAttribute("data-client-id") === client.id) {
        focusClient.current = client.id;
      }
      changeStage(client.id, originalStage);
      setFeedback({ error: true, message: error instanceof Error ? error.message : "No se pudo mover el cliente." });
    } finally {
      saving.current = false;
      setPending(null);
    }
  }

  function closeNote() {
    setNoteClient(null);
    noteTrigger.current?.focus({ preventScroll: true });
  }

  return (
    <div className="flex h-[max(25rem,calc(100dvh-10rem))] min-h-0 min-w-0 flex-col gap-2 lg:h-auto lg:flex-1">
      <div ref={boardRef} className="min-h-0 flex-1 snap-x overflow-x-auto overflow-y-hidden pb-1 [scrollbar-width:thin] [scrollbar-color:var(--color-border)_transparent]" aria-label="Tablero de clientes" role="region" tabIndex={0}>
        {columns.length === 0 && <p className="rounded-xl border border-border bg-white p-5 text-sm text-muted">Selecciona las columnas que quieres ver en Filtros.</p>}
        <div className={`grid h-full min-w-full gap-2.5 [--crm-column-width:15rem] ${columns.length <= 4 ? "lg:[--crm-column-width:11.5rem]" : "lg:[--crm-column-width:14rem]"}`}
          style={{ gridTemplateColumns: `repeat(${Math.max(1, columns.length)}, minmax(var(--crm-column-width), 1fr))`, width: `max(100%, calc(${columns.length} * var(--crm-column-width) + ${Math.max(0, columns.length - 1) * 0.625}rem))` }}>
          {columns.map((stage) => {
            const cards = orderClientCards(clients.filter((client) => (client.crmArchiveState ?? client.crmStage) === stage.id), cardOrder[stage.id]);
            const color = colors[stage.id];
            const archivedColumn = isCrmArchiveState(stage.id);
            const columnCollapsed = cards.length > 0 && cards.every(({ id }) => collapsed.has(id));
            return (
              <section key={stage.id} aria-label={stage.label}
                className={`flex min-h-0 min-w-0 snap-start flex-col rounded-2xl border border-border border-t-[3px] bg-white/80 p-2.5 motion-safe:transition-shadow motion-safe:duration-150 ${color.accent} ${target === stage.id ? "ring-2 ring-inset ring-primary/55" : ""}`}
                onDragOver={(event) => {
                  const client = draggedClient.current;
                  if (!client || saving.current) return;
                  const position = archivedColumn ? null : insertionAt(event, client);
                  setInsertion(position);
                  if (!position && client.crmStage === stage.id) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setTarget(stage.id);
                }}
                onDragLeave={(event) => {
                  if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) {
                    setTarget((current) => current === stage.id ? null : current);
                    setInsertion(null);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const client = draggedClient.current;
                  if (client) {
                    const position = insertionAt(event, client) ?? undefined;
                    if (isCrmArchiveState(stage.id)) {
                      setArchive({ client, state: stage.id });
                    } else if (stage.id === "PROPOSAL_REJECTED" && client.crmStage !== stage.id) {
                      setRejecting({ client, position });
                    } else {
                      void move(client, stage.id, false, position);
                    }
                  }
                  setInsertion(null);
                  draggedClient.current = null;
                  setDragging(null);
                  setTarget(null);
                }}>
                <div className="mb-2 flex min-h-9 shrink-0 items-center justify-between gap-1.5 border-b border-border/70 pb-2">
                  <h2 className="flex items-baseline gap-1.5 text-sm font-bold leading-tight tracking-tight text-foreground 2xl:text-base">
                    <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${color.dot}`} />
                    {stage.label}
                  </h2>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-foreground">{cards.length}</span>
                    {!archivedColumn && cards.length > 0 && <button type="button"
                      onClick={() => onCollapse(cards.map(({ id }) => id), !columnCollapsed)}
                      aria-label={`${columnCollapsed ? "Expandir" : "Minimizar"} tarjetas de ${stage.label}`}
                      title={`${columnCollapsed ? "Expandir" : "Minimizar"} esta columna`}
                      className="inline-flex size-6 items-center justify-center rounded-md text-primary hover:bg-primary/10 focus-visible:outline-primary">
                      {columnCollapsed ? <ChevronsUpDown size={15} aria-hidden="true" /> : <ChevronsDownUp size={15} aria-hidden="true" />}
                    </button>}
                  </div>
                </div>
                <div role="region" aria-label={`Tarjetas de ${stage.label}`} tabIndex={cards.length ? 0 : undefined}
                  className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain rounded-xl p-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-2 focus-visible:outline-primary">
                <ul className="space-y-2">
                  {cards.map((client) => {
                    const compact = archivedColumn || collapsed.has(client.id);
                    const indicator = stage.id === "QUOTED" ? quoteIndicators[client.id] : undefined;
                    const quoteStyle = indicator ? quoteStyles[indicator] : undefined;
                    const quoteTone = quoteStyle ? quoteTones[quoteStyle.tone] : undefined;
                    const quoteDescriptionId = quoteStyle ? `${boardId}-${client.id}-quote` : undefined;
                    const servicesDescriptionId = `${boardId}-${client.id}-services`;
                    const description = [quoteDescriptionId, client.serviceInterests.length ? servicesDescriptionId : null].filter(Boolean).join(" ");
                    const contact = client.contacts[0];
                    const responsible = client.kind === "business" ? client.responsible : contact?.assignedExecutive;
                    const responsibleId = assigned[client.id] ?? responsible?.id ?? "";
                    const contactName = contact ? personName(contact) : "";
                    const initials = client.name.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join("").toLocaleUpperCase("es-CL");
                    return <li key={client.id} data-client-id={client.id}
                      className={`relative rounded-xl border shadow-[0_1px_2px_rgba(20,20,45,0.08)] transition-colors ${quoteTone ? `border-l-4 ${quoteTone}` : `bg-white hover:border-primary/35 focus-within:border-primary/45 ${compact ? "border-border" : "border-primary/35"}`} ${dragging?.id === client.id ? "opacity-50" : ""}`}
                      draggable={!archivedColumn && pending === null}
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", client.id);
                        draggedClient.current = client;
                        setDragging(client);
                      }}
                      onDragEnd={() => { draggedClient.current = null; setDragging(null); setTarget(null); setInsertion(null); }}>
                      {quoteStyle && <span hidden id={quoteDescriptionId}>{quoteStyle.label}</span>}
                      {insertion?.key === client.id && <span aria-hidden="true" className={`pointer-events-none absolute inset-x-0 z-10 h-0.5 rounded-full bg-primary ${insertion.after ? "-bottom-1" : "-top-1"}`} />}
                      <div className={compact ? "px-2.5 py-1 2xl:py-1.5" : "space-y-2.5 p-2.5"}>
                        <div className={`flex gap-1.5 ${compact ? "items-center" : "items-start"}`}>
                          {!compact && client.serviceInterests.length === 0 && <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[11px] font-bold text-primary" aria-hidden="true">{initials}</span>}
                          <button type="button" draggable={false} onClick={() => onOpenClient(client.id)}
                            aria-describedby={description || undefined}
                            className="flex min-h-10 min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-0.5 self-center py-1 text-left text-sm font-bold leading-tight tracking-tight text-foreground hover:text-primary focus-visible:rounded-md focus-visible:outline-primary 2xl:text-base">
                            <span className="min-w-0 break-words">{client.name}</span>
                            <ClientServiceIcons services={client.serviceInterests} descriptionId={servicesDescriptionId} />
                          </button>
                          {!archivedColumn && <button type="button" draggable={false} onClick={() => onCollapse([client.id], !compact)}
                            aria-expanded={!compact} aria-label={`${compact ? "Expandir" : "Minimizar"} tarjeta de ${client.name}`}
                            title={compact ? "Expandir tarjeta" : "Minimizar tarjeta"}
                            className={`inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-primary hover:bg-primary/10 focus-visible:outline-primary lg:size-7 ${compact ? "" : "bg-primary/10"}`}>
                            {compact ? <ChevronDown size={15} aria-hidden="true" /> : <ChevronUp size={15} aria-hidden="true" />}
                          </button>}
                          {!archivedColumn && <GripVertical aria-hidden="true" size={15} className="shrink-0 self-center cursor-grab text-muted/70" />}
                        </div>
                        {!compact && <>
                        {contactName !== client.name && <p className="flex items-start gap-1.5 text-xs leading-snug text-muted 2xl:text-sm">
                          <ContactRound size={14} aria-hidden="true" className="shrink-0" />
                          <span className="min-w-0 break-words">{contactName || "Sin contactos"}</span>
                        </p>}
                        {contact?.interestServiceName && !clientServiceInterestFromName(contact.interestServiceName) && <p className="flex items-start gap-1.5 text-xs leading-snug text-muted">
                          <BriefcaseBusiness size={14} aria-hidden="true" className="shrink-0" />
                          <span className="min-w-0 break-words">{contact.interestServiceName}</span>
                        </p>}
                        <div className="flex flex-wrap items-center justify-between gap-x-1.5 gap-y-2">
                          <label className="flex min-w-0 max-w-full items-center gap-1 text-xs text-primary">
                            <UserRound size={13} aria-hidden="true" className="shrink-0" />
                            <select aria-label={`Responsable de ${client.name}`} value={responsibleId}
                              disabled={assigning !== null}
                              className="min-h-8 min-w-0 max-w-full cursor-pointer rounded-md bg-transparent px-1 font-medium hover:bg-primary/10"
                              onChange={(event) => void assign(client, event.target.value)}>
                              <option value="">Sin asignar</option>
                              {responsible && !assignable.some(({ id }) => id === responsible.id) && <option value={responsible.id} disabled>{getAssignedExecutiveName(responsible)}</option>}
                              {assignable.map((person) => <option key={person.id} value={person.id}>{getAssignedExecutiveName(person)}</option>)}
                            </select>
                          </label>
                          <select aria-label={`Clasificación de ${client.name}`} value={client.status}
                            disabled={classifying !== null}
                            className={`max-w-full rounded-full border border-transparent px-1.5 py-1 text-[11px] font-semibold focus-visible:outline-primary ${statusStyles[client.status]}`}
                            onChange={async (event) => {
                              const status = event.target.value;
                              if (!isClientStatus(status)) return;
                              setClassifying(client.id);
                              try { await onStatusChange(client.id, status); }
                              finally { setClassifying(null); }
                            }}>
                            {CLIENT_STATUSES.map((status) => <option key={status} value={status}>{getClientStatusLabel(status)}</option>)}
                          </select>
                        </div>
                        </>}
                      </div>
                      {stage.id === "ARCHIVED" && <div className="px-2.5 pb-2.5">
                        <ClientStageSelect name={client.name} currentStage={stage.id} onSelect={(nextStage) => onReactivateArchived(client, nextStage)} />
                      </div>}
                      {!compact && <div className="grid grid-cols-2 gap-2 rounded-b-xl border-t border-border/70 p-2.5">
                        <button type="button" onClick={(event) => {
                          noteTrigger.current = event.currentTarget;
                          setFeedback(null);
                          setNoteClient(client);
                        }} aria-label={`Nota rápida para ${client.name}`}
                          className="inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-1.5 text-xs font-semibold text-primary hover:bg-primary/15 focus-visible:outline-primary lg:min-h-9">
                          <StickyNote size={14} aria-hidden="true" /> Nota
                        </button>
                        <button type="button" draggable={false} onClick={() => onSchedule(client.id)}
                          aria-label={`Agendar actividad para ${client.name}`} title="Agendar actividad"
                          className="inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-1.5 text-xs font-semibold text-primary hover:bg-primary/15 focus-visible:outline-primary lg:min-h-9">
                          <CalendarPlus size={15} aria-hidden="true" /> Agendar
                        </button>
                        {(stage.id === "QUOTED" || (stage.id === "CONTACTED" && contactedQuoteKeys.has(client.id))) && <button type="button" draggable={false}
                          onClick={() => { setFeedback(null); setQuoteClient(client); }}
                          aria-label={`Resolver cotización de ${client.name}`}
                          className={`${quoteActionClassName} border border-primary/25 bg-white text-center hover:bg-primary/5`}>
                          <FileCheck2 size={15} className="shrink-0" aria-hidden="true" /> Resolver cotización
                        </button>}
                        {(stage.id === "NEW" || stage.id === "CONTACTED") && <Link href={`/dashboard/cotizaciones?clientId=${encodeURIComponent(client.id)}&nueva=1&origen=clientes`}
                          prefetch={false} draggable={false} aria-label={`Cotizar para ${client.name}`}
                          className={`${quoteActionClassName} bg-primary/10 hover:bg-primary/15`}>
                          <FileText size={15} aria-hidden="true" /> Cotizar
                        </Link>}
                        <div className="col-span-full">
                          <ClientStageSelect name={client.name} currentStage={stage.id} locked={pending !== null} saving={pending === client.id}
                          onSelect={(state) => {
                            if (saving.current) return;
                            if (isCrmArchiveState(state)) {
                              setArchive({ client, state });
                            } else if (state === "PROPOSAL_REJECTED") {
                              setRejecting({ client });
                            } else {
                              const label = CRM_STAGES.find((entry) => entry.id === state)?.label;
                              if (window.confirm(`¿Cambiar el estado de ${client.name} a «${label}»?`)) {
                                void move(client, state, true);
                              }
                            }
                          }} />
                        </div>
                      </div>}
                    </li>;
                  })}
                </ul>
                {cards.length === 0 && (
                  <p className="rounded-xl border border-dashed border-slate-300 p-3 text-center text-xs text-muted">
                    {target === stage.id ? "Soltar aquí" : "Sin clientes"}
                  </p>
                )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
      {rejecting && <DashboardFormModal eyebrow="Clientes" title="Mover a Propuesta rechazada" onClose={() => setRejecting(null)}>
        <form onSubmit={(event) => {
          event.preventDefault();
          setRejecting(null);
          void move(rejecting.client, "PROPOSAL_REJECTED", true, rejecting.position);
        }}>
          <p className="break-words p-4 text-sm">¿Confirmas mover a <strong>{rejecting.client.name}</strong> a «Propuesta rechazada»?</p>
          <DashboardFormFooter>
            <DashboardFormActions onCancel={() => setRejecting(null)} submitLabel="Confirmar cambio" />
          </DashboardFormFooter>
        </form>
      </DashboardFormModal>}
      {archive && <ArchiveClientForm {...archive} onClose={() => setArchive(null)} onSaved={() => {
        const label = crmArchiveLabel(archive.state);
        setFeedback({ error: false, message: `${archive.client.name} pasó a «${label}».` });
        setArchive(null);
        router.refresh();
      }} />}
      {noteClient && <QuickNoteForm client={noteClient} onClose={closeNote} onSaved={() => {
        closeNote();
        setFeedback({ error: false, message: `Nota guardada para ${noteClient.name}.` });
      }} />}
      {quoteClient && <ClientQuoteDecisionDialog client={quoteClient} onClose={() => setQuoteClient(null)}
        onAccepted={(quoteId, newlyAccepted) => {
          if (newlyAccepted) onMoved(quoteClient.id, "NEGOTIATION");
          setQuoteClient(null);
          router.push(`/dashboard/ventas?cotizacion=${encodeURIComponent(quoteId)}`);
        }}
        onRejected={(number) => {
          setQuoteClient(null);
          setFeedback({ error: false, message: `La cotización ${number} quedó rechazada.` });
          router.refresh();
        }} />}
      {feedback && (
        <p role={feedback.error ? "alert" : "status"} className={feedback.error ? "text-sm text-red-700" : "text-sm text-emerald-700"}>
          {feedback.message}
        </p>
      )}
    </div>
  );
}


function ArchiveClientForm({ client, state, onClose, onSaved }: {
  client: CommercialClient;
  state: CrmArchiveState;
  onClose: () => void;
  onSaved: () => void;
}) {
  const paused = state === "PAUSED";
  const archived = state === "ARCHIVED";
  const saving = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    const form = new FormData(event.currentTarget);
    const reactivateOn = form.get("reactivateOn");
    const note = String(form.get("note") ?? "").trim();
    if ((!note && !archived) || note.length > 10000) {
      setError("Escribe una nota de hasta 10.000 caracteres.");
      return;
    }
    if (paused && !parseReactivationDate(reactivateOn)) {
      setError("Elige una fecha de reactivación posterior a hoy.");
      return;
    }

    const account = parseCommercialClientId(client.id)!;
    saving.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/clientes/${encodeURIComponent(account.id)}/archivo`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: account.kind, state, confirmed: true, reactivateOn, note }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "No se pudo guardar el cambio.");
      onSaved();
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo guardar el cambio.");
    } finally {
      saving.current = false;
      setPending(false);
    }
  }

  return (
    <DashboardFormModal eyebrow="Clientes" title={archived ? "Archivar cliente" : paused ? "Poner en pausa" : "Marcar como perdido"}
      onClose={() => { if (!saving.current) onClose(); }}>
      <form onSubmit={submit} className="flex min-h-0 flex-col">
        <div className="space-y-3 overflow-y-auto p-4">
          <p className="break-words text-sm font-semibold">{client.name}</p>
          <p className="text-sm text-muted">{paused
            ? "La tarjeta volverá a su columna en la fecha elegida."
            : "La tarjeta se archivará sin reactivación automática."}</p>
          <label className="block text-sm font-medium">
            Motivo del cambio {archived && <span className="font-normal text-muted">(opcional)</span>}
            <textarea name="note" required={!archived} maxLength={10000} rows={4} autoFocus
              className="dashboard-field mt-1.5 resize-y" placeholder="Explica el motivo y el próximo paso…" />
          </label>
          {paused && <label className="block text-sm font-medium">
            Fecha de reactivación
            <input name="reactivateOn" type="date" min={new Date(Date.parse(crmToday() + "T00:00:00Z") + 86_400_000).toISOString().slice(0, 10)} required className="dashboard-field mt-1.5" />
          </label>}
        </div>
        <DashboardFormFooter error={error}>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={pending} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold">Cancelar</button>
            <button type="submit" disabled={pending} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Guardando…" : "Confirmar cambio"}</button>
          </div>
        </DashboardFormFooter>
      </form>
    </DashboardFormModal>
  );
}

function QuickNoteForm({ client, onClose, onSaved }: { client: CommercialClient; onClose: () => void; onSaved: () => void }) {
  const saving = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    const content = String(new FormData(event.currentTarget).get("content") ?? "").trim();
    if (!content) {
      setError("Escribe la nota antes de guardar.");
      return;
    }
    saving.current = true;
    setPending(true);
    setError("");
    try {
      const account = parseCommercialClientId(client.id)!;
      const id = encodeURIComponent(account.id);
      const url = account.kind === "business" ? `/api/clientes/${id}/notas` : `/api/clients/${id}/notes`;
      const response = await fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "No se pudo guardar la nota.");
      onSaved();
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo guardar la nota.");
    } finally {
      saving.current = false;
      setPending(false);
    }
  }

  return (
    <DashboardFormModal eyebrow="Clientes" title="Nota rápida" onClose={() => { if (!saving.current) onClose(); }}>
      <form onSubmit={submit} className="flex min-h-0 flex-col">
        <div className="space-y-3 overflow-y-auto p-4">
          <p className="break-words text-sm font-semibold text-foreground">{client.name}</p>
          <label className="block text-sm font-medium text-foreground">
            Nota
            <textarea name="content" required autoFocus rows={4} className="dashboard-field mt-1.5 resize-y"
              placeholder="Escribe un comentario o el próximo paso…" />
          </label>
        </div>
        <DashboardFormFooter error={error}>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={pending} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold">Cancelar</button>
            <button type="submit" disabled={pending} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Guardando…" : "Guardar nota"}</button>
          </div>
        </DashboardFormFooter>
      </form>
    </DashboardFormModal>
  );
}
