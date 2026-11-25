"use client";

import Link from "next/link";
import { Check, Eye, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import type { CommercialClient } from "@/lib/clients/commercial-clients";
import { formatCurrency } from "@/lib/orders/service";
import { getQuoteStatusLabel, type QuoteRecord } from "@/lib/quotes/types";

type QuoteChoice = Pick<QuoteRecord, "id" | "number" | "validUntil" | "total" | "status"> & { name: string };
type Decision = "ACCEPTED" | "REJECTED";

const dateFormatter = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeZone: "America/Santiago" });
const actionClass = "inline-flex items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60";
const iconActionClass = `${actionClass} size-11 shrink-0`;
const textActionClass = `${actionClass} min-h-10 px-3 text-sm font-semibold`;
const viewClass = "bg-primary/10 text-primary hover:bg-primary/15";
const acceptClass = "bg-emerald-700 text-white hover:bg-emerald-800";
const rejectClass = "bg-rose-700 text-white hover:bg-rose-800";

export function ClientQuoteDecisionDialog({ client, onClose, onAccepted, onRejected }: {
  client: CommercialClient;
  onClose: () => void;
  onAccepted: (quoteId: string, newlyAccepted: boolean) => void;
  onRejected: (quoteNumber: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const saving = useRef(false);
  const id = useId();
  const [quotes, setQuotes] = useState<QuoteChoice[] | null>(null);
  const [decision, setDecision] = useState<{ quoteId: string; status: Decision } | null>(null);
  const [pending, setPending] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [decisionError, setDecisionError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const accepting = decision?.status === "ACCEPTED";

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function loadQuotes() {
      try {
        const response = await fetch(`/api/quotes?context=decision&clientId=${encodeURIComponent(client.id)}`, {
          cache: "no-store", signal: controller.signal,
        });
        const result: { quotes?: QuoteChoice[]; error?: string } = await response.json();
        if (!response.ok || !Array.isArray(result.quotes)) throw new Error(result.error || "No se pudieron cargar las cotizaciones.");
        if (!controller.signal.aborted) setQuotes(result.quotes);
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : "No se pudieron cargar las cotizaciones.");
      }
    }
    void loadQuotes();
    return () => controller.abort();
  }, [attempt, client.id]);

  function beginDecision(quoteId: string, status: Decision) {
    setDecisionError("");
    setDecision({ quoteId, status });
  }

  async function saveDecision(quote: QuoteChoice, status: Decision) {
    if (saving.current) return;
    saving.current = true;
    setPending(true);
    setDecisionError("");
    try {
      const response = await fetch(`/api/quotes/${encodeURIComponent(quote.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, clientKey: client.id }),
      });
      const result: { error?: string } | null = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || "No se pudo registrar la decisión.");
      if (status === "ACCEPTED") onAccepted(quote.id, true);
      else onRejected(quote.number);
    } catch (error) {
      setDecisionError(error instanceof Error ? error.message : "No se pudo registrar la decisión.");
    } finally {
      saving.current = false;
      setPending(false);
    }
  }

  return (
    <dialog ref={dialog} aria-labelledby={`${id}-title`} onClose={onClose}
      onCancel={(event) => { if (saving.current) event.preventDefault(); }}
      className="fixed inset-0 m-auto w-[calc(100%-1.5rem)] max-w-2xl overflow-hidden rounded-[22px] border border-border bg-white p-0 text-foreground shadow-2xl backdrop:bg-navy/45">
      <div className="flex max-h-[min(92dvh,40rem)] flex-col">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 id={`${id}-title`} className="text-lg font-bold tracking-tight">Resolver cotización</h2>
            <p className="break-words text-sm text-muted">{client.name}</p>
          </div>
          <button type="button" aria-label="Cerrar" disabled={pending} onClick={() => dialog.current?.close()}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-soft-background disabled:opacity-50">
            <X size={17} aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 space-y-3 overflow-y-auto px-4 py-4 text-sm">
          {loadError ? <div className="space-y-2">
            <p role="alert" className="text-red-700">{loadError}</p>
            <button type="button" className="font-semibold text-primary underline" onClick={() => { setLoadError(""); setAttempt(attempt + 1); }}>
              Reintentar
            </button>
          </div> : !quotes ? <p role="status" className="text-muted">Cargando cotizaciones…</p>
            : quotes.length === 0 ? <div className="space-y-2">
                <p className="text-muted">No hay cotizaciones disponibles para aceptar o rechazar.</p>
                <Link href={`/dashboard/cotizaciones?clientId=${encodeURIComponent(client.id)}`} prefetch={false}
                  className="inline-block font-semibold text-primary hover:underline">Ver historial de cotizaciones</Link>
              </div>
              : <ul aria-label="Cotizaciones del cliente" className="space-y-2">
                {quotes.map((quote) => (
                  <li key={quote.id} className="rounded-xl border border-border bg-slate-50 p-3">
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                      <div className="min-w-0">
                        <h3 className="break-words font-semibold">{quote.name || quote.number}</h3>
                        <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
                          {quote.name && <span className="text-xs text-muted">{quote.number}</span>}
                          <span className="font-semibold tabular-nums">{formatCurrency(quote.total)}</span>
                        </p>
                        <p className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted">
                          <span>{getQuoteStatusLabel(quote.status)}</span>
                          {quote.validUntil ? <span>Vence el <time dateTime={quote.validUntil}>{dateFormatter.format(new Date(quote.validUntil))}</time></span>
                            : <span>Sin vencimiento</span>}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <Link href={`/dashboard/cotizaciones/${encodeURIComponent(quote.id)}`} prefetch={false}
                          aria-label={`Ver ${quote.number}`} title="Ver cotización" aria-disabled={pending} tabIndex={pending ? -1 : undefined}
                          onClick={(event) => { if (saving.current) event.preventDefault(); }} className={`${iconActionClass} ${viewClass} aria-disabled:opacity-60`}>
                          <Eye size={18} aria-hidden="true" />
                        </Link>
                        {quote.status === "ACCEPTED" ? (
                          <button type="button" className={`${textActionClass} ${acceptClass}`} disabled={pending} onClick={() => onAccepted(quote.id, false)}>Ir a cerrar venta</button>
                        ) : <>
                          <button type="button" aria-label={`Aceptar ${quote.number}`} title="Aceptar cotización"
                            className={`${iconActionClass} ${acceptClass}`} disabled={pending} onClick={() => beginDecision(quote.id, "ACCEPTED")}>
                            <Check size={18} aria-hidden="true" />
                          </button>
                          <button type="button" aria-label={`Rechazar ${quote.number}`} title="Rechazar cotización"
                            className={`${iconActionClass} ${rejectClass}`} disabled={pending} onClick={() => beginDecision(quote.id, "REJECTED")}>
                            <X size={18} aria-hidden="true" />
                          </button>
                        </>}
                      </div>
                    </div>
                    {decision?.quoteId === quote.id && <div className="mt-3 space-y-2 border-t border-border pt-3">
                      <p className="font-semibold">¿{accepting ? "Aceptar" : "Rechazar"} esta cotización?</p>
                      <p className="text-muted">{accepting
                        ? "Podrás revisar los datos de la venta y programar el cobro en Ventas."
                        : "Puedes mover la tarjeta a Propuesta rechazada desde Cambiar etapa."}</p>
                      {decisionError && <p role="alert" className="text-rose-700">{decisionError}</p>}
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <button type="button" className={`${textActionClass} border border-border bg-white`} disabled={pending}
                          onClick={() => { setDecision(null); setDecisionError(""); }}>Volver</button>
                        <button type="button" className={`${textActionClass} ${accepting ? acceptClass : rejectClass}`} disabled={pending}
                          onClick={() => void saveDecision(quote, decision.status)}>
                          {pending ? "Guardando…" : accepting ? "Aceptar e ir a Ventas" : "Confirmar rechazo"}
                        </button>
                      </div>
                    </div>}
                  </li>
                ))}
              </ul>}
        </div>
      </div>
    </dialog>
  );
}
