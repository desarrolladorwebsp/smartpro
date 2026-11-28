"use client";

import { useEffect, useRef, useState } from "react";

import { formatCurrency } from "@/lib/orders/service";
import type { PaymentRequestSummary } from "@/lib/sales/payment-requests";

const labels: Record<PaymentRequestSummary["status"], string> = {
  PENDING: "Pendiente", PROCESSING: "Pago en curso", PAID: "Pagado", CANCELLED: "Cancelado",
};
const dateFormat = new Intl.DateTimeFormat("es-CL", { dateStyle: "short", timeStyle: "short", timeZone: "America/Santiago" });
const secondary = "min-h-10 rounded-xl border border-border px-3 text-sm font-semibold text-primary hover:border-primary/40 disabled:opacity-50";

type Reply = { requests?: PaymentRequestSummary[]; request?: PaymentRequestSummary; recipient?: string | null; emailError?: string; error?: string };

export function SalePaymentRequests({ saleId, balance, suggestedAmount, open, onClose }: {
  saleId: string; balance: number; suggestedAmount: number; open: boolean; onClose: () => void;
}) {
  const endpoint = `/api/sales/${encodeURIComponent(saleId)}/payment-requests`;
  const dialog = useRef<HTMLDialogElement>(null);
  const requestKey = useRef<string | null>(null);
  const submitting = useRef(false);
  const [requests, setRequests] = useState<PaymentRequestSummary[]>([]);
  const [recipient, setRecipient] = useState<string | null>(null);
  const [amount, setAmount] = useState(String(suggestedAmount));
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void fetch(endpoint, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json() as Reply;
        if (!response.ok) throw new Error(data.error ?? "No se pudo leer el historial.");
        if (controller.signal.aborted) return;
        setRequests(data.requests ?? []);
        setRecipient(data.recipient ?? null);
      })
      .catch((reason: Error) => { if (!controller.signal.aborted) setError(reason.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [endpoint]);

  useEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) element.showModal();
    if (!open && element?.open) element.close();
  }, [open]);

  async function update(payload: Record<string, string>) {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json() as Reply;
      const updated = data.request;
      if (!response.ok || !updated) throw new Error(data.error ?? "No se pudo guardar la solicitud.");
      setRequests((current) => current.some((row) => row.id === updated.id)
        ? current.map((row) => row.id === updated.id ? updated : row)
        : [updated, ...current]);
      if (payload.action === "create") {
        requestKey.current = null;
        onClose();
      }
      if (payload.action === "refresh") {
        setMessage(updated.status === "PROCESSING" ? "Webpay aún no confirma el pago." : `Estado del enlace: ${labels[updated.status]}.`);
        if (updated.status === "PAID") window.location.reload();
      } else {
        setMessage(payload.action === "cancel" ? "Enlace cancelado." : data.emailError ?? "Correo enviado al cliente.");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo guardar la solicitud.");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setError("");
      setMessage("Enlace copiado.");
    } catch {
      setError("No se pudo copiar automáticamente. Selecciona el enlace y cópialo desde el campo.");
    }
  }

  const pending = requests.find(({ status }) => status === "PENDING" || status === "PROCESSING");
  return <section id="solicitudes-abono" className="rounded-[24px] border border-border bg-white p-5 sm:p-6" aria-labelledby="sale-payment-requests-heading">
    <h2 id="sale-payment-requests-heading" className="text-lg font-bold">Solicitudes de abono</h2>
    <div role="status" className="text-sm text-muted">{message || (loading ? "Cargando solicitudes…" : requests.length === 0 && !error ? "Sin solicitudes de abono." : "")}</div>
    {error && !open && <p role="alert" className="mt-2 text-sm text-rose-700">{error}</p>}
    {requests.length > 0 && <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border">
      {requests.map((row) => {
        const available = row.status === "PENDING" || row.status === "PROCESSING";
        return <li key={row.id} className="space-y-2 p-3 text-sm sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold tabular-nums">{formatCurrency(row.amount)}</p>
            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${row.status === "PAID" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>{labels[row.status]}</span>
          </div>
          <p className="break-words text-xs text-muted">
            {dateFormat.format(new Date(row.createdAt))} · {row.emailAcceptedAt ? `Correo enviado a ${row.recipient}` : "Correo sin confirmación de envío"}
          </p>
          {available && <div className="flex flex-wrap gap-2">
            <input aria-label="Enlace de abono" readOnly value={row.url} onFocus={(event) => event.currentTarget.select()} className="dashboard-field min-w-0 basis-full text-xs sm:flex-1" />
            <button type="button" onClick={() => void copy(row.url)} className={secondary}>Copiar enlace</button>
            {(row.recipient || recipient) && <button type="button" disabled={busy} onClick={() => void update({ action: "resend", id: row.id, key: crypto.randomUUID() })} className={secondary}>{row.emailAcceptedAt ? "Reenviar correo" : "Enviar correo"}</button>}
            {row.status === "PENDING" && <button type="button" disabled={busy} onClick={() => void update({ action: "cancel", id: row.id })} className={secondary}>Cancelar enlace</button>}
            {row.status === "PROCESSING" && <button type="button" disabled={busy} onClick={() => void update({ action: "refresh", id: row.id })} className={secondary}>Consultar pago</button>}
          </div>}
        </li>;
      })}
    </ul>}

    <dialog ref={dialog} aria-labelledby="sale-request-title" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}
      className="fixed inset-0 m-auto w-[calc(100%_-_1.5rem)] max-w-md rounded-[22px] border border-border bg-white p-5 text-foreground shadow-xl backdrop:bg-black/40">
      <h2 id="sale-request-title" className="text-lg font-bold">Solicitar abono</h2>
      {pending ? <div className="mt-3 space-y-3">
        <p className="text-sm text-muted">Ya hay una solicitud por {formatCurrency(pending.amount)}. Puedes gestionarla desde el historial.</p>
        <button type="button" onClick={() => { onClose(); document.getElementById("solicitudes-abono")?.scrollIntoView({ block: "nearest" }); }} className={secondary}>Ver historial</button>
      </div> : <form className="mt-3 space-y-4" onSubmit={(event) => {
        event.preventDefault();
        requestKey.current ??= crypto.randomUUID();
        void update({ action: "create", amount, key: requestKey.current });
      }}>
        <p className="text-sm text-muted">Saldo pendiente {formatCurrency(balance)}</p>
        <label className="block text-sm font-semibold">Monto del abono en CLP
          <input className="dashboard-field mt-1" inputMode="numeric" required maxLength={30} value={amount} disabled={busy}
            onChange={(event) => { setAmount(event.currentTarget.value); requestKey.current = null; }} />
        </label>
        <p className="break-words text-sm text-muted">{recipient ? `El enlace se enviará a ${recipient}.` : "El cliente no tiene correo registrado. Podrás copiar el enlace desde el historial."}</p>
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" disabled={busy} onClick={onClose} className={secondary}>Cerrar</button>
          <button type="submit" disabled={busy || loading} className="min-h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? "Generando…" : recipient ? "Generar y enviar" : "Generar enlace"}
          </button>
        </div>
      </form>}
    </dialog>
  </section>;
}
