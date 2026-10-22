"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import { formatCurrency } from "@/lib/orders/service";
import { parseSalePaymentAmount, roundClp } from "@/lib/sales/balances";
import {
  getSalePaymentMethodLabel,
  getSaleReceiptValidationError,
  SALE_OBSERVATION_MAX_LENGTH,
  SALE_PAYMENT_METHODS,
  SALE_RECEIPT_ACCEPT,
  type SalePaymentRecord,
  type SalePaymentMethod,
  type SaleRecord,
} from "@/lib/sales/types";

type SalePaymentModalProps = {
  sale: SaleRecord | null;
  payment?: SalePaymentRecord | null;
  onClose: () => void;
  onSaved?: (sale: SaleRecord) => void;
};

function toDateInputValue(value?: string | null) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function SalePaymentModal({ sale, payment = null, onClose, onSaved }: SalePaymentModalProps) {
  if (!sale) return null;
  return <SalePaymentForm key={payment?.id ?? "new-payment"} sale={sale} payment={payment} onClose={onClose} onSaved={onSaved} />;
}

function SalePaymentForm({ sale, payment, onClose, onSaved }: { sale: SaleRecord; payment: SalePaymentRecord | null; onClose: () => void; onSaved?: (sale: SaleRecord) => void }) {
  const maximumAmount = roundClp(payment ? sale.balanceDue + payment.amount : sale.balanceDue);
  const isSavingRef = useRef(false);
  const [amount, setAmount] = useState(String(roundClp(payment?.amount ?? sale.balanceDue)));
  const [paymentMethod, setPaymentMethod] = useState<SalePaymentMethod>(payment?.method ?? "transfer");
  const [paidAt, setPaidAt] = useState(() => toDateInputValue(payment?.paidAt));
  const [observation, setObservation] = useState(payment?.observation ?? "");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [removeReceipt, setRemoveReceipt] = useState(false);
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
  }, [onClose]);

  async function submit() {
    if (isSavingRef.current) return;
    const receiptError = getSaleReceiptValidationError(receipt);
    if (receiptError) {
      setSubmitError(receiptError);
      return;
    }
    let parsedAmount: number;
    try {
      parsedAmount = parseSalePaymentAmount(amount, maximumAmount);
      if (parsedAmount < 1) throw new Error("El monto del pago debe ser mayor a 0.");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Ingresa un monto válido.");
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    setSubmitError("");

    try {
      const formData = new FormData();
      formData.append("amount", String(parsedAmount));
      formData.append("paymentMethod", paymentMethod);
      formData.append("paidAt", paidAt);
      formData.append("observation", observation);
      if (payment) formData.append("paymentId", payment.id);
      if (removeReceipt) formData.append("removeReceipt", "true");
      if (receipt && receipt.size > 0) formData.append("receipt", receipt);

      const response = await fetch(`/api/sales/${sale.id}/payments`, {
        method: payment ? "PATCH" : "POST",
        body: formData,
      });
      const data = (await response.json().catch(() => ({}))) as { sale?: SaleRecord; error?: string };
      if (!response.ok || !data.sale) {
        throw new Error(data.error ?? (payment ? "No se pudo actualizar el pago." : "No se pudo registrar el abono."));
      }
      onSaved?.(data.sale);
      onClose();
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo guardar el pago.");
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
        aria-labelledby="sale-payment-title"
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-[26px] border border-border bg-white shadow-[0_24px_64px_rgba(16,16,36,0.20)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Cuentas por cobrar</p>
            <h2 id="sale-payment-title" className="mt-1 text-2xl font-bold tracking-[-0.05em] text-foreground">
              {payment ? "Editar pago y comprobante" : "Registrar abono"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {sale.number} · saldo {formatCurrency(sale.balanceDue)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Cerrar modal"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-muted disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-foreground">Fecha del pago</span>
            <input type="date" value={paidAt} onChange={(event) => setPaidAt(event.target.value)} className="dashboard-field" disabled={isSaving} required />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-foreground">Monto</span>
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="dashboard-field"
              disabled={isSaving}
              required
            />
          </label>
          <button type="button" onClick={() => setAmount(String(maximumAmount))} disabled={isSaving || maximumAmount <= 0} className="rounded-full border border-border px-3 py-2 text-sm font-semibold text-primary disabled:opacity-50">
            {payment ? "Usar monto máximo" : "Pagar saldo completo"} · {formatCurrency(maximumAmount)}
          </button>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-foreground">Medio de pago</span>
            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value as SalePaymentMethod)}
              className="dashboard-field"
              disabled={isSaving}
            >
              {SALE_PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>{getSalePaymentMethodLabel(method)}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-foreground">Descripción</span>
            <textarea
              value={observation}
              onChange={(event) => setObservation(event.target.value.slice(0, SALE_OBSERVATION_MAX_LENGTH))}
              className="dashboard-field min-h-20 resize-y"
              disabled={isSaving}
              maxLength={SALE_OBSERVATION_MAX_LENGTH}
              placeholder="Detalle o referencia del pago"
            />
            <span className="mt-1 block text-xs text-muted">{observation.length}/{SALE_OBSERVATION_MAX_LENGTH} caracteres</span>
          </label>
          <div>
            <span className="mb-1.5 block text-sm font-semibold text-foreground">Comprobante · imagen o PDF</span>
            {payment?.receiptPath ? (
              <div className="mb-2 flex flex-wrap items-center gap-3 text-sm">
                <a href={payment.receiptPath} target="_blank" rel="noreferrer" className="font-medium text-primary underline">
                  Ver actual{payment.receiptFileName ? ` · ${payment.receiptFileName}` : ""}
                </a>
                <label className="inline-flex items-center gap-2 text-muted">
                  <input type="checkbox" checked={removeReceipt} onChange={(event) => setRemoveReceipt(event.target.checked)} disabled={isSaving || Boolean(receipt)} />
                  Quitar archivo actual
                </label>
              </div>
            ) : null}
            <input
              type="file"
              accept={SALE_RECEIPT_ACCEPT}
              disabled={isSaving}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setReceipt(file);
                if (file) setRemoveReceipt(false);
                setSubmitError(getSaleReceiptValidationError(file) ?? "");
              }}
              className="dashboard-field file:mr-3 file:rounded-full file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-primary"
            />
            <p className="mt-1.5 text-xs text-muted">
              PDF, JPG, PNG o WEBP. Máximo 4 MB. {payment ? "Déjalo vacío para conservar el archivo actual." : "Opcional."}
            </p>
          </div>
        </div>

        <div className="space-y-3 border-t border-border px-5 py-4">
          {submitError ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{submitError}</p> : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={isSaving} className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold disabled:opacity-50">
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={isSaving || !paidAt || !amount}
              className="min-h-11 rounded-full bg-gradient-to-r from-primary to-magenta px-5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSaving ? "Guardando..." : payment ? "Guardar cambios" : "Registrar abono"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
