"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

import type { ClientRecord } from "@/lib/clients/types";
import { formatCurrency } from "@/lib/orders/service";
import { getQuoteStatusLabel, type QuoteRecord } from "@/lib/quotes/types";
import {
  getSaleReceiptValidationError,
  SALE_OBSERVATION_MAX_LENGTH,
  SALE_RECEIPT_ACCEPT,
  type QuoteForSaleConversion,
  type SaleRecord,
} from "@/lib/sales/types";

type SaleCreateModalProps = {
  open: boolean;
  onClose: () => void;
  clients: ClientRecord[];
  onCreated?: (sale: SaleRecord) => void;
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

export function SaleCreateModal({ open, ...props }: SaleCreateModalProps) {
  if (!open) return null;
  return <SaleCreateForm {...props} />;
}

function SaleCreateForm({ onClose, clients, onCreated }: Omit<SaleCreateModalProps, "open">) {
  const isSavingRef = useRef(false);
  const quotesRequestRef = useRef(0);
  const [clientId, setClientId] = useState("");
  const [quoteId, setQuoteId] = useState("");
  const [quotes, setQuotes] = useState<QuoteForSaleConversion[]>([]);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [quotesError, setQuotesError] = useState("");
  const [observation, setObservation] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSavingRef.current) onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      quotesRequestRef.current += 1;
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  async function loadQuotesForClient(nextClientId: string) {
    const requestId = ++quotesRequestRef.current;
    setClientId(nextClientId);
    setQuoteId("");
    setQuotes([]);
    setQuotesError("");
    setSubmitError("");

    if (!nextClientId) {
      setIsLoadingQuotes(false);
      return;
    }

    setIsLoadingQuotes(true);

    try {
      const response = await fetch(`/api/sales/quotes?clientId=${encodeURIComponent(nextClientId)}`, { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as {
        quotes?: QuoteForSaleConversion[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "No se pudieron cargar las cotizaciones del cliente.");
      }
      if (requestId !== quotesRequestRef.current) return;
      setQuotes(Array.isArray(data.quotes) ? data.quotes : []);
    } catch (error: unknown) {
      if (requestId !== quotesRequestRef.current) return;
      setQuotes([]);
      setQuotesError(error instanceof Error ? error.message : "No se pudieron cargar las cotizaciones del cliente.");
    } finally {
      if (requestId === quotesRequestRef.current) {
        setIsLoadingQuotes(false);
      }
    }
  }

  const selectedOption = useMemo(
    () => quotes.find((entry) => entry.quote.id === quoteId) ?? null,
    [quotes, quoteId],
  );
  const selectedQuote: QuoteRecord | null = selectedOption?.convertible ? selectedOption.quote : null;

  async function convert() {
    if (isSavingRef.current) return;

    if (!clientId) {
      setSubmitError("Selecciona un cliente.");
      return;
    }
    if (!selectedQuote) {
      setSubmitError("Selecciona una cotización válida.");
      return;
    }

    const receiptError = getSaleReceiptValidationError(receipt);
    if (receiptError) {
      setSubmitError(receiptError);
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    setSubmitError("");

    try {
      const formData = new FormData();
      formData.append("quoteId", selectedQuote.id);
      formData.append("observation", observation);
      if (receipt && receipt.size > 0) {
        formData.append("receipt", receipt);
      }

      const response = await fetch("/api/sales", { method: "POST", body: formData });
      const data = (await response.json().catch(() => ({}))) as { sale?: SaleRecord; error?: string };
      if (!response.ok || !data.sale) {
        throw new Error(data.error ?? "No se pudo registrar la venta.");
      }

      onCreated?.(data.sale);
      onClose();
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo registrar la venta.");
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-3 sm:p-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sale-create-title"
        className="flex max-h-[min(92vh,820px)] w-full max-w-3xl flex-col overflow-hidden rounded-[26px] border border-border bg-white shadow-[0_24px_64px_rgba(16,16,36,0.20)]"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Ventas</p>
            <h2 id="sale-create-title" className="mt-1 text-2xl font-bold tracking-[-0.05em] text-foreground">
              Nueva venta
            </h2>
            <p className="mt-1 text-sm text-muted">Selecciona un cliente, su cotización y adjunta el comprobante si corresponde.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Cerrar modal"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-muted transition hover:border-primary/30 hover:text-primary disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-foreground">Cliente</span>
            <select
              value={clientId}
              onChange={(event) => {
                void loadQuotesForClient(event.target.value);
              }}
              className="dashboard-field"
              disabled={isSaving}
            >
              <option value="">Selecciona un cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.companyName} — {client.contactFirstName} {client.contactLastName}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-foreground">Cotización</span>
            <select
              value={quoteId}
              onChange={(event) => {
                setQuoteId(event.target.value);
                setSubmitError("");
              }}
              className="dashboard-field"
              disabled={!clientId || isLoadingQuotes || isSaving}
            >
              <option value="">{isLoadingQuotes ? "Cargando cotizaciones..." : "Selecciona una cotización"}</option>
              {quotes.map((entry) => (
                <option key={entry.quote.id} value={entry.quote.id} disabled={!entry.convertible}>
                  {entry.quote.number} · {getQuoteStatusLabel(entry.quote.status)} · {formatCurrency(entry.quote.total)}
                  {entry.convertible ? "" : ` — ${entry.reason ?? "No convertible"}`}
                </option>
              ))}
            </select>
          </label>

          {quotesError ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{quotesError}</p> : null}

          {clientId && !isLoadingQuotes && !quotesError && quotes.length === 0 ? (
            <p className="rounded-xl border border-border bg-slate-50 px-3 py-2 text-sm text-muted">Este cliente no tiene cotizaciones.</p>
          ) : null}

          {selectedQuote ? (
            <div className="rounded-[20px] border border-border bg-slate-50/80 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Datos de la cotización</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted">Número</p>
                  <p className="font-semibold">{selectedQuote.number}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Estado</p>
                  <p className="font-semibold">{getQuoteStatusLabel(selectedQuote.status)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Fecha</p>
                  <p className="font-semibold">{formatDate(selectedQuote.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Vence</p>
                  <p className="font-semibold">{formatDate(selectedQuote.validUntil)}</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {selectedQuote.items.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-3">
                    <span>
                      {item.planName}
                      {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                    </span>
                    <span className="shrink-0 font-medium">{formatCurrency(item.total)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
                <div className="flex justify-between gap-3"><span className="text-muted">Subtotal</span><span>{formatCurrency(selectedQuote.subtotal)}</span></div>
                <div className="flex justify-between gap-3"><span className="text-muted">IVA</span><span>{formatCurrency(selectedQuote.tax)}</span></div>
                <div className="flex justify-between gap-3 font-semibold"><span>Total</span><span className="text-primary">{formatCurrency(selectedQuote.total)}</span></div>
              </div>
            </div>
          ) : null}

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-foreground">Observación</span>
            <textarea
              value={observation}
              onChange={(event) => setObservation(event.target.value.slice(0, SALE_OBSERVATION_MAX_LENGTH))}
              className="dashboard-field min-h-24 resize-y"
              placeholder="Opcional. Notas internas de la venta."
              disabled={isSaving}
              maxLength={SALE_OBSERVATION_MAX_LENGTH}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-foreground">Comprobante de pago</span>
            <input
              type="file"
              accept={SALE_RECEIPT_ACCEPT}
              disabled={isSaving}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setReceipt(file);
                setSubmitError(getSaleReceiptValidationError(file) ?? "");
              }}
              className="dashboard-field file:mr-3 file:rounded-full file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-primary"
            />
            <p className="mt-1.5 text-xs text-muted">PDF o imagen (JPG, PNG, WEBP). Máximo 5 MB. Opcional.</p>
            {receipt ? <p className="mt-1 text-xs font-medium text-foreground">{receipt.name}</p> : null}
          </label>
        </div>

        <div className="shrink-0 space-y-3 border-t border-border px-5 py-4 sm:px-6">
          {submitError ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{submitError}</p> : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={isSaving} className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold disabled:opacity-50">
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void convert()}
              disabled={isSaving || !selectedQuote}
              className="min-h-11 rounded-full bg-gradient-to-r from-primary to-magenta px-5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSaving ? "Convirtiendo..." : "Convertir en venta"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
