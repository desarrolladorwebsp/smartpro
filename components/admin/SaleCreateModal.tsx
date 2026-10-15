"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

import type { ClientRecord } from "@/lib/clients/types";
import { formatCurrency } from "@/lib/orders/service";
import { quoteDepositAmounts } from "@/lib/quotes/fields";
import { getQuoteStatusLabel, type QuoteRecord } from "@/lib/quotes/types";
import {
  getSalePaymentMethodLabel,
  getSaleReceiptValidationError,
  calculateNetSaleAmounts,
  SALE_MANUAL_PAYMENT_METHODS,
  SALE_OBSERVATION_MAX_LENGTH,
  SALE_RECEIPT_ACCEPT,
  type QuoteForSaleConversion,
  type SaleManualPaymentMethod,
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

function todayDateInputValue(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

type SaleEntryMode = "DIRECT" | "QUOTE";

export function SaleCreateModal({ open, ...props }: SaleCreateModalProps) {
  if (!open) return null;
  return <SaleCreateForm {...props} />;
}

function SaleCreateForm({ onClose, clients, onCreated }: Omit<SaleCreateModalProps, "open">) {
  const isSavingRef = useRef(false);
  const quotesRequestRef = useRef(0);
  const [entryMode, setEntryMode] = useState<SaleEntryMode>("DIRECT");
  const [clientId, setClientId] = useState("");
  const [quoteId, setQuoteId] = useState("");
  const [quotes, setQuotes] = useState<QuoteForSaleConversion[]>([]);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [quotesError, setQuotesError] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [netAmount, setNetAmount] = useState("");
  const [soldAt, setSoldAt] = useState(todayDateInputValue);
  const [observation, setObservation] = useState("");
  const [paidAmount, setPaidAmount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<SaleManualPaymentMethod | "">("");
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
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    return () => {
      quotesRequestRef.current += 1;
    };
  }, []);

  async function loadQuotesForClient(nextClientId: string) {
    const requestId = ++quotesRequestRef.current;
    setClientId(nextClientId);
    setQuoteId("");
    setPaidAmount("0");
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

  function selectClient(nextClientId: string) {
    if (entryMode === "QUOTE") {
      void loadQuotesForClient(nextClientId);
      return;
    }

    quotesRequestRef.current += 1;
    setClientId(nextClientId);
    setQuoteId("");
    setPaidAmount("0");
    setQuotes([]);
    setIsLoadingQuotes(false);
    setQuotesError("");
    setSubmitError("");
  }

  function changeEntryMode(nextMode: SaleEntryMode) {
    if (nextMode === entryMode) return;
    setEntryMode(nextMode);
    setQuoteId("");
    setPaidAmount("0");
    setPaymentMethod(nextMode === "DIRECT" ? "" : "transfer");
    setSubmitError("");
    setQuotesError("");

    if (nextMode === "DIRECT") {
      quotesRequestRef.current += 1;
      setQuotes([]);
      setIsLoadingQuotes(false);
    } else if (clientId) {
      void loadQuotesForClient(clientId);
    }
  }

  const selectedOption = useMemo(
    () => quotes.find((entry) => entry.quote.id === quoteId) ?? null,
    [quotes, quoteId],
  );
  const selectedQuote: QuoteRecord | null = selectedOption?.convertible ? selectedOption.quote : null;
  const deposit = selectedQuote ? quoteDepositAmounts(selectedQuote) : null;
  const directNetAmount = Number(netAmount);
  const directAmountsValid =
    netAmount.trim() !== "" && Number.isSafeInteger(directNetAmount) && directNetAmount >= 0;
  const directAmounts = directAmountsValid
    ? calculateNetSaleAmounts(directNetAmount)
    : { subtotal: 0, tax: 0, total: 0 };
  const directTotal = directAmounts.total;
  const activeTotal = entryMode === "DIRECT" ? directTotal : selectedQuote?.total ?? 0;
  const receivedAmount = Number(paidAmount || 0);
  const receivedAmountValid =
    Number.isSafeInteger(receivedAmount) &&
    receivedAmount >= 0 &&
    receivedAmount <= activeTotal;
  const canSubmit = entryMode === "DIRECT"
    ? Boolean(clientId && serviceName.trim() && soldAt && directAmountsValid && directTotal > 0 && receivedAmountValid)
    : Boolean(selectedQuote && receivedAmountValid && (receivedAmount === 0 || paymentMethod));

  async function create() {
    if (isSavingRef.current) return;

    if (!clientId) {
      setSubmitError("Selecciona un cliente.");
      return;
    }
    if (entryMode === "QUOTE" && !selectedQuote) {
      setSubmitError("Selecciona una cotización válida.");
      return;
    }
    if (entryMode === "DIRECT" && !serviceName.trim()) {
      setSubmitError("Describe el servicio de la venta.");
      return;
    }
    if (entryMode === "DIRECT" && (!soldAt || !directAmountsValid || directTotal < 1)) {
      setSubmitError("Ingresa una fecha y un monto neto válido para la venta directa.");
      return;
    }
    if (!receivedAmountValid) {
      setSubmitError("El monto recibido debe ser un monto válido y no puede superar el total de la venta.");
      return;
    }
    if (entryMode === "QUOTE" && receivedAmount > 0 && !paymentMethod) {
      setSubmitError("Selecciona un medio de pago para el monto recibido.");
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
      formData.append("saleType", entryMode);
      if (entryMode === "DIRECT") {
        formData.append("clientId", clientId);
        formData.append("serviceName", serviceName.trim());
        formData.append("netAmount", String(directNetAmount));
        formData.append("soldAt", soldAt);
      } else if (selectedQuote) {
        formData.append("quoteId", selectedQuote.id);
      }
      formData.append("observation", observation);
      formData.append("paidAmount", paidAmount);
      formData.append("paymentMethod", paymentMethod);
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
            <p className="mt-1 text-sm text-muted">
              {entryMode === "DIRECT"
                ? "Registra una venta directa aunque no exista una cotización. Puedes dejar saldo pendiente."
                : "Convierte una cotización existente y registra cuánto se recibió ahora."}
            </p>
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
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => changeEntryMode("DIRECT")}
              disabled={isSaving}
              aria-pressed={entryMode === "DIRECT"}
              className={`min-h-10 rounded-xl px-3 text-sm font-semibold transition ${entryMode === "DIRECT" ? "bg-white text-primary shadow-sm" : "text-muted hover:text-foreground"}`}
            >
              Venta directa
            </button>
            <button
              type="button"
              onClick={() => changeEntryMode("QUOTE")}
              disabled={isSaving}
              aria-pressed={entryMode === "QUOTE"}
              className={`min-h-10 rounded-xl px-3 text-sm font-semibold transition ${entryMode === "QUOTE" ? "bg-white text-primary shadow-sm" : "text-muted hover:text-foreground"}`}
            >
              Desde cotización
            </button>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-foreground">Cliente</span>
            <select
              value={clientId}
              onChange={(event) => {
                selectClient(event.target.value);
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

          {entryMode === "QUOTE" ? (
            <>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-foreground">Cotización</span>
                <select
                  value={quoteId}
                  onChange={(event) => {
                    const nextId = event.target.value;
                    setQuoteId(nextId);
                    setSubmitError("");
                    const next = quotes.find((entry) => entry.quote.id === nextId);
                    setPaidAmount(next?.convertible ? String(quoteDepositAmounts(next.quote).total) : "0");
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
            </>
          ) : (
            <div className="space-y-4 rounded-[20px] border border-border bg-slate-50/80 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Datos de la venta directa</p>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-foreground">Servicio o detalle</span>
                <input
                  value={serviceName}
                  onChange={(event) => setServiceName(event.target.value)}
                  className="dashboard-field"
                  placeholder="Ej.: Landing Page"
                  maxLength={160}
                  disabled={isSaving}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-foreground">Fecha de venta</span>
                  <input type="date" value={soldAt} onChange={(event) => setSoldAt(event.target.value)} className="dashboard-field" disabled={isSaving} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-foreground">Monto neto (sin IVA)</span>
                  <input type="number" min={0} step={1} value={netAmount} onChange={(event) => setNetAmount(event.target.value)} className="dashboard-field" disabled={isSaving} />
                </label>
                <div className="rounded-xl border border-border bg-white px-3 py-2 sm:col-span-2">
                  <div className="grid gap-2 text-sm sm:grid-cols-3">
                    <div><span className="block text-xs text-muted">Neto ingresado</span><span className="font-semibold">{formatCurrency(directAmounts.subtotal)}</span></div>
                    <div><span className="block text-xs text-muted">IVA calculado (19%)</span><span className="font-semibold">{formatCurrency(directAmounts.tax)}</span></div>
                    <div><span className="block text-xs text-muted">Total de venta</span><span className="font-bold text-primary">{formatCurrency(directTotal)}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                {deposit && !deposit.isFull ? (
                  <div className="flex justify-between gap-3 text-muted">
                    <span>Abono inicial ({deposit.percent}%)</span>
                    <span>{formatCurrency(deposit.total)}</span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-foreground">
                Monto recibido ahora{entryMode === "DIRECT" ? " (opcional)" : ""}
              </span>
              <input
                type="number"
                min={0}
                max={activeTotal || undefined}
                step={1}
                value={paidAmount}
                onChange={(event) => setPaidAmount(event.target.value)}
                className="dashboard-field"
                disabled={isSaving || activeTotal <= 0}
              />
              <p className="mt-1.5 text-xs text-muted">0 deja la venta como deuda. Puedes registrar el abono o el total.</p>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-foreground">Medio de pago</span>
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value as SaleManualPaymentMethod | "")}
                className="dashboard-field"
                disabled={isSaving || receivedAmount <= 0 || activeTotal <= 0}
              >
                {entryMode === "DIRECT" ? <option value="">Sin especificar (opcional)</option> : <option value="">Selecciona un medio de pago</option>}
                {SALE_MANUAL_PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {getSalePaymentMethodLabel(method)}
                  </option>
                ))}
              </select>
              {entryMode === "DIRECT" ? (
                <p className="mt-1.5 text-xs text-muted">Puedes registrar el total, un abono parcial o dejar el pago pendiente. Si no indicas el medio, quedará como “Otro medio”.</p>
              ) : null}
            </label>
          </div>

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
              onClick={() => void create()}
              disabled={isSaving || !canSubmit}
              className="min-h-11 rounded-full bg-gradient-to-r from-primary to-magenta px-5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSaving ? "Registrando..." : entryMode === "DIRECT" ? "Registrar venta" : "Convertir en venta"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
