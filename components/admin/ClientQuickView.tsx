"use client";

import { CalendarPlus, FileText, Plus, Video, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { ClientCreationDate } from "@/components/admin/ClientCreationDate";
import { ClientSendpulseConversation } from "@/components/admin/ClientSendpulseConversation";
import { CLIENT_ACQUISITION_ORIGINS } from "@/lib/clients/acquisition-origin";
import { parseCommercialClientId, personName, type CommercialClient } from "@/lib/clients/commercial-clients";
import { CRM_STAGES, getAssignedExecutiveName, getClientStatusLabel } from "@/lib/clients/types";
import { formatCurrency } from "@/lib/orders/service";
import { canEditQuote } from "@/lib/quotes/status";
import { getQuoteStatusLabel, type QuoteRecord } from "@/lib/quotes/types";
import type { SendpulseConversationOption } from "@/lib/sendpulse/conversation-access";

const clientTabs = ["Resumen", "Reuniones", "Cotizaciones"] as const;
const sendpulseTabs = [...clientTabs, "SendPulse"] as const;
const sendpulseTab = clientTabs.length;
const documentDate = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeZone: "America/Santiago" });
const calendarDate = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeZone: "UTC" });
const chileClock = new Intl.DateTimeFormat("sv-SE", {
  dateStyle: "short", timeStyle: "short", hourCycle: "h23", timeZone: "America/Santiago",
});

type Meeting = { id: string; date: string; time: string; title: string; duration: number; joinUrl: string | null };
type QuickView = {
  note: { title: string; content: string; createdAt: string } | null;
  quotes: Pick<QuoteRecord, "id" | "number" | "createdAt" | "total" | "status">[];
  meetings: Meeting[];
  sendpulseOptions?: SendpulseConversationOption[];
};

function meetingLabel({ date, time, duration }: Meeting) {
  return `${calendarDate.format(new Date(date + "T00:00:00Z"))} · ${time} · ${duration} min`;
}

const secondaryButton = "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-border px-3 text-sm font-semibold text-primary hover:bg-primary/10";
const primaryButton = "inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-3 text-sm font-semibold text-white hover:bg-primary/90";

export function ClientQuickView({ client, onClose, onSchedule }: { client: CommercialClient; onClose: () => void; onSchedule: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const id = useId();
  const [selectedTab, setTab] = useState(0);
  const [data, setData] = useState<QuickView | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const key = encodeURIComponent(client.id);
  const showSendpulse = client.kind === "business" && client.origin === "SENDPULSE";
  const tabs = showSendpulse ? sendpulseTabs : clientTabs;
  const tab = selectedTab < tabs.length ? selectedTab : 0;

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/clients/quick-view?cliente=${key}`, { signal: controller.signal });
        if (!response.ok) throw new Error();
        const result: QuickView = await response.json();
        if (!controller.signal.aborted) setData(result);
      } catch {
        if (!controller.signal.aborted) setError("No se pudieron cargar la última nota, las reuniones y las cotizaciones.");
      }
    }
    void load();
    return () => controller.abort();
  }, [key, attempt]);

  function selectTab(index: number) {
    setTab(index);
    content.current?.scrollTo({ top: 0 });
  }

  function navigateTabs(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, Home: -index, End: tabs.length - 1 - index };
    const offset = offsets[event.key];
    if (offset === undefined) return;
    event.preventDefault();
    const next = (index + offset + tabs.length) % tabs.length;
    selectTab(next);
    document.getElementById(`${id}-tab-${next}`)?.focus();
  }

  const now = Date.parse(chileClock.format(new Date()).replace(" ", "T") + "Z");
  const upcoming: Meeting[] = [];
  const previous: Meeting[] = [];
  for (const meeting of data?.meetings ?? []) {
    const endsAt = Date.parse(`${meeting.date}T${meeting.time}:00Z`) + meeting.duration * 60_000;
    if (endsAt > now) upcoming.push(meeting);
    else previous.unshift(meeting);
  }
  const nextMeeting = upcoming[0];
  const executive = client.kind === "business" ? client.responsible : client.contacts[0]?.assignedExecutive;
  const stage = CRM_STAGES.find(({ id: value }) => value === client.crmStage)?.label;
  const status = client.crmArchiveState === "PAUSED" ? "En pausa"
    : client.crmArchiveState === "LOST" ? "Perdido" : getClientStatusLabel(client.status);

  return (
    <dialog ref={dialog} onClose={onClose} aria-labelledby={`${id}-title`}
      className="fixed inset-0 m-auto h-[min(90dvh,32rem)] w-[calc(100%-1.5rem)] max-w-2xl overflow-hidden rounded-3xl border border-border bg-white p-0 text-foreground shadow-2xl backdrop:bg-navy/45">
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex shrink-0 items-start gap-2 px-4 pb-3 pt-4 sm:items-center sm:px-6 sm:pt-5">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex min-w-0 max-w-full items-center gap-2 sm:gap-3">
              <h2 id={`${id}-title`} className="min-w-0 break-words text-xl font-bold tracking-tight sm:text-2xl">{client.name}</h2>
              <p className="max-w-[45%] shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-muted">{status}{stage && !client.crmArchiveState && ` · ${stage}`}</p>
            </div>
            {nextMeeting?.joinUrl && <a href={nextMeeting.joinUrl} target="_blank" rel="noopener noreferrer" className={`${primaryButton} sm:ml-auto`}>
              <Video size={16} aria-hidden="true" /> Unirse a Zoom
            </a>}
          </div>
          <button type="button" aria-label="Cerrar ficha" onClick={() => dialog.current?.close()}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-slate-100">
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div role="tablist" aria-label="Ficha del cliente" className="flex shrink-0 overflow-x-auto border-b border-border px-1.5 min-[390px]:px-2 sm:px-6">
          {tabs.map((name, index) => (
            <button key={name} type="button" role="tab" id={`${id}-tab-${index}`} aria-controls={`${id}-panel-${index}`}
              aria-selected={index === tab} tabIndex={index === tab ? 0 : -1} onClick={() => selectTab(index)}
              onKeyDown={(event) => navigateTabs(event, index)}
              className={`min-h-11 shrink-0 border-b-2 px-1.5 text-[13px] font-semibold min-[390px]:px-2 min-[390px]:text-sm sm:px-4 ${index === tab ? "border-primary text-primary" : "border-transparent text-muted hover:text-primary"}`}>
              {name}
            </button>
          ))}
        </div>

        <div ref={content} className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {error && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              <p role="alert">{error}</p>
              <button type="button" className="font-semibold underline" onClick={() => { setError(""); setAttempt(attempt + 1); }}>Reintentar</button>
            </div>
          )}
          <section role="tabpanel" id={`${id}-panel-0`} aria-labelledby={`${id}-tab-0`} hidden={tab !== 0} tabIndex={0} className="space-y-4">
            <dl className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3.5 text-sm">
              <div><dt className="text-muted">Ejecutivo asignado</dt><dd className="mt-1 break-words font-semibold">{getAssignedExecutiveName(executive) || "Sin asignar"}</dd></div>
              {client.rut && <div><dt className="text-muted">RUT</dt><dd className="mt-1 font-semibold">{client.rut}</dd></div>}
              {client.kind === "business" && <div><dt className="text-muted">Origen</dt><dd className="mt-1 break-words font-semibold">{client.origin ? CLIENT_ACQUISITION_ORIGINS[client.origin] : "Sin origen"}</dd></div>}
              <div><dt className="text-muted">Fecha de creación</dt><dd className="mt-1 font-semibold"><ClientCreationDate createdAt={client.createdAt} /></dd></div>
            </dl>
            <div>
              <h3 className="text-sm font-semibold">Contactos</h3>
              {client.contacts.length ? <ul className="mt-1 divide-y divide-border">
                {client.contacts.map((contact) => <li key={contact.id} className="py-2 text-sm">
                  <p className="font-medium">{personName(contact) || "Contacto sin nombre"}{contact.jobTitle && ` · ${contact.jobTitle}`}</p>
                  <p className="break-words text-muted">{[contact.email, contact.phone].filter(Boolean).join(" · ")}</p>
                </li>)}
              </ul> : <p className="mt-1 text-sm text-muted">Sin contactos asociados.</p>}
            </div>
            <div className="rounded-2xl border border-border p-3.5 text-sm">
              <h3 className="font-semibold">Última nota</h3>
              {data?.note ? <div className="mt-1 space-y-1">
                {data.note.title && <p className="font-medium">{data.note.title}</p>}
                <p className="whitespace-pre-wrap break-words text-muted">{data.note.content}</p>
                <time dateTime={data.note.createdAt} className="text-xs text-muted">{documentDate.format(new Date(data.note.createdAt))}</time>
              </div> : <p className="mt-1 text-muted">{data ? "Sin notas registradas." : error ? "Nota no disponible." : "Cargando nota…"}</p>}
            </div>
            <Link href={client.href} className="inline-block text-sm font-semibold text-primary hover:underline">Ver ficha completa</Link>
          </section>

          <section role="tabpanel" id={`${id}-panel-1`} aria-labelledby={`${id}-tab-1`} hidden={tab !== 1} tabIndex={0} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Próximas reuniones</h3>
              <button type="button" onClick={onSchedule} className={secondaryButton}>
                <CalendarPlus size={16} aria-hidden="true" /> Agendar actividad
              </button>
            </div>
            {!data && !error && <p role="status" className="text-sm text-muted">Cargando reuniones…</p>}
            {data && !upcoming.length && <p className="text-sm text-muted">Sin próximas reuniones.</p>}
            {upcoming.length > 0 && <ul className="space-y-2">
              {upcoming.map((meeting) => <li key={meeting.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-primary/10 p-3.5 text-sm">
                <div><p className="font-semibold">{meeting.title}</p><p className="mt-1 text-muted">{meetingLabel(meeting)}</p></div>
                {meeting.id !== nextMeeting?.id && meeting.joinUrl && (
                  <a href={meeting.joinUrl} target="_blank" rel="noopener noreferrer" className={secondaryButton}>Unirse a Zoom</a>
                )}
              </li>)}
            </ul>}
            {previous.length > 0 && <div>
              <h3 className="mb-2 text-sm font-semibold">Reuniones anteriores</h3>
              <ul className="divide-y divide-border">{previous.map((meeting) => <li key={meeting.id} className="py-2 text-sm">
                <p className="font-medium">{meeting.title}</p><p className="text-muted">{meetingLabel(meeting)}</p>
              </li>)}</ul>
            </div>}
          </section>

          <section role="tabpanel" id={`${id}-panel-2`} aria-labelledby={`${id}-tab-2`} hidden={tab !== 2} tabIndex={0} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Cotizaciones del cliente</h3>
              <Link href={`/dashboard/cotizaciones?clientId=${key}&nueva=1`} className={primaryButton}>
                <Plus size={16} aria-hidden="true" /> Nueva cotización
              </Link>
            </div>
            {!data && !error && <p role="status" className="text-sm text-muted">Cargando cotizaciones…</p>}
            {data && !data.quotes.length && <p className="text-sm text-muted">Sin cotizaciones registradas.</p>}
            <ul className="divide-y divide-border">
              {data?.quotes.map((quote) => {
                const href = `/dashboard/cotizaciones/${encodeURIComponent(quote.id)}`;
                return <li key={quote.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div className="flex items-start gap-2">
                    <FileText size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-primary" />
                    <div><p className="font-semibold">{quote.number} <span className="font-normal text-muted">· {getQuoteStatusLabel(quote.status)}</span></p>
                      <p className="text-xs text-muted">{documentDate.format(new Date(quote.createdAt))} · {formatCurrency(quote.total)}</p></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={href} aria-label={`Ver cotización ${quote.number}`} className={secondaryButton}>Ver</Link>
                    {canEditQuote(quote.status) && <Link href={`${href}?editar=1`} aria-label={`Editar cotización ${quote.number}`} className={secondaryButton}>Editar</Link>}
                  </div>
                </li>;
              })}
            </ul>
          </section>
          {showSendpulse && <section role="tabpanel" id={`${id}-panel-${sendpulseTab}`} aria-labelledby={`${id}-tab-${sendpulseTab}`} hidden={tab !== sendpulseTab} tabIndex={0}>
            {data ? <ClientSendpulseConversation
              accountId={parseCommercialClientId(client.id)?.id ?? ""}
              options={data.sendpulseOptions ?? []}
              active={tab === sendpulseTab}
              manualView
            /> : !error && <p role="status" className="text-sm text-muted">Cargando contactos vinculados a SendPulse…</p>}
          </section>}
        </div>
      </div>
    </dialog>
  );
}
