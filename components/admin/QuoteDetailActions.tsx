"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { ConfirmActionModal } from "@/components/admin/ConfirmActionModal";
import { QuoteCreateModal } from "@/components/admin/QuoteCreateModal";
import { formatCurrency } from "@/lib/orders/service";
import { canEditQuote, canSendQuote, canSetQuoteStatusManually, canTransitionQuoteStatus } from "@/lib/quotes/status";
import {
  QUOTE_STATUSES,
  getQuoteStatusLabel,
  type QuoteRecord,
  type QuoteStatus,
} from "@/lib/quotes/types";

type QuoteDetailActionsProps = {
  quote: QuoteRecord;
};

export function QuoteDetailActions({ quote }: QuoteDetailActionsProps) {
  const router = useRouter();
  const [current, setCurrent] = useState(quote);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSendConfirmOpen, setIsSendConfirmOpen] = useState(false);

  useEffect(() => {
    setCurrent(quote);
  }, [quote]);

  async function sendQuote() {
    if (isSending) return;
    setIsSending(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/quotes/${current.id}/send`, { method: "POST" });
      const data = (await response.json().catch(() => ({}))) as { quote?: QuoteRecord; error?: string };

      if (!response.ok || !data.quote) {
        setError(data.error ?? "No se pudo enviar la cotización.");
        return;
      }

      setCurrent(data.quote);
      setIsSendConfirmOpen(false);
      setMessage(`Cotización enviada a ${data.quote.clientEmail}.`);
      router.refresh();
    } catch {
      setError("No se pudo enviar la cotización.");
    } finally {
      setIsSending(false);
    }
  }

  async function changeStatus(status: QuoteStatus) {
    if (isUpdating || status === current.status) return;
    if (!canSetQuoteStatusManually(status)) {
      setError("La cotización solo se marca como enviada al confirmar el envío por correo.");
      return;
    }

    setIsUpdating(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/quotes/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await response.json().catch(() => ({}))) as { quote?: QuoteRecord; error?: string };

      if (!response.ok || !data.quote) {
        setError(data.error ?? "No se pudo actualizar el estado.");
        return;
      }

      setCurrent(data.quote);
      setMessage(`Estado actualizado a ${getQuoteStatusLabel(data.quote.status)}.`);
      router.refresh();
    } catch {
      setError("No se pudo actualizar el estado.");
    } finally {
      setIsUpdating(false);
    }
  }

  const sendDisabled = isSending || !current.clientEmail || !canSendQuote(current.status);
  const sendLabel = isSending
    ? "Enviando..."
    : !canSendQuote(current.status)
      ? "No se puede enviar"
      : current.clientEmail
        ? current.status === "SENT"
          ? "Reenviar cotización"
          : "Enviar cotización"
        : "Cliente sin correo";

  return (
    <aside className="space-y-4 rounded-[26px] border border-border bg-white p-5 shadow-[0_18px_46px_rgba(16,16,36,0.04)]">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Acciones</p>
        <h2 className="mt-2 text-xl font-bold tracking-[-0.05em] text-foreground">Gestión</h2>
      </div>

      {message ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">{message}</p> : null}
      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p> : null}

      <div className="rounded-[20px] border border-border bg-slate-50/80 p-4">
        <p className="text-xs text-muted">Total</p>
        <p className="mt-1 text-2xl font-bold tracking-[-0.05em] text-foreground">{formatCurrency(current.total)}</p>
        <p className="mt-1 text-sm text-muted">{getQuoteStatusLabel(current.status)}</p>
      </div>

      {canEditQuote(current.status) ? (
        <button
          type="button"
          onClick={() => setIsEditOpen(true)}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-border px-4 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:text-primary"
        >
          Modificar cotización
        </button>
      ) : null}

      <a
        href={`/api/quotes/${current.id}/pdf`}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-border px-4 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:text-primary"
      >
        Descargar PDF
      </a>

      <button
        type="button"
        onClick={() => setIsSendConfirmOpen(true)}
        disabled={sendDisabled}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-primary to-magenta px-4 text-sm font-semibold text-white disabled:opacity-60"
      >
        {sendLabel}
      </button>
      <p className="text-xs leading-5 text-muted">
        El correo con el PDF solo se envía después de confirmar esta acción.
      </p>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-foreground">Cambiar estado</span>
        <select
          value={current.status}
          disabled={isUpdating}
          onChange={(event) => void changeStatus(event.target.value as QuoteStatus)}
          className="dashboard-field"
        >
          {QUOTE_STATUSES.map((status) => (
            <option
              key={status}
              value={status}
              disabled={
                !canTransitionQuoteStatus(current.status, status) ||
                (status !== current.status && !canSetQuoteStatusManually(status))
              }
            >
              {getQuoteStatusLabel(status)}
            </option>
          ))}
        </select>
      </label>

      <Link href={`/dashboard/clientes/${current.clientId}`} className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-border px-4 text-sm font-semibold">
        Ver cliente
      </Link>

      <QuoteCreateModal
        open={isEditOpen}
        quote={current}
        onClose={() => setIsEditOpen(false)}
        onCreated={(nextQuote) => {
          setCurrent(nextQuote);
          setMessage(`Cotización ${nextQuote.number} actualizada. Aún no se envió al cliente.`);
          setError("");
          router.refresh();
        }}
      />

      <ConfirmActionModal
        open={isSendConfirmOpen}
        title={current.status === "SENT" ? "Reenviar cotización" : "Enviar cotización"}
        description={`Se enviará ${current.number} a ${current.clientEmail || "el cliente"} con el PDF adjunto. Revisa que el contenido esté listo antes de confirmar.`}
        confirmLabel={current.status === "SENT" ? "Confirmar reenvío" : "Confirmar envío"}
        busyLabel="Enviando..."
        isBusy={isSending}
        onCancel={() => {
          if (!isSending) setIsSendConfirmOpen(false);
        }}
        onConfirm={() => void sendQuote()}
      />
    </aside>
  );
}
