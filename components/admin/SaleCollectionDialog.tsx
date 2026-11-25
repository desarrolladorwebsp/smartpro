"use client";

import { CalendarClock, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";

import { calendarToday, parseCalendarDate } from "@/lib/calendar-slots";
import { formatCurrency } from "@/lib/orders/service";
import { buildCollectionPreview, type CollectionDue, type CollectionMode, type SaleCollection } from "@/lib/sales/collections";

const dateFormatter = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function formatCollectionDate(date: string) {
  return dateFormatter.format(new Date(`${date}T00:00:00Z`));
}

const dueStatus: Record<CollectionDue["status"], { label: string; style: string }> = {
  PAID: { label: "Pagado", style: "bg-emerald-50 text-emerald-800" },
  UPCOMING: { label: "Pendiente", style: "bg-slate-100 text-slate-700" },
  DUE: { label: "Vence hoy", style: "bg-amber-50 text-amber-900" },
  OVERDUE: { label: "Vencido", style: "bg-rose-50 text-rose-800" },
};

export function SaleCollectionDues({ dues }: { dues: CollectionDue[] }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-white">
      {dues.map((due) => (
        <li key={due.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-3 py-2.5 text-sm">
          <div className="min-w-0">
            <p className="font-semibold"><time dateTime={due.dueOn}>{formatCollectionDate(due.dueOn)}</time></p>
            {dues.length > 1 && <p className="text-xs text-muted">Cuota {due.sequence} de {dues.length}</p>}
          </div>
          <div className="text-right">
            <p className="font-semibold tabular-nums">{formatCurrency(due.status === "PAID" ? due.amount : due.remaining)}</p>
            <p className={`inline-block rounded-full px-2 py-0.5 text-xs ${dueStatus[due.status].style}`}>{dueStatus[due.status].label}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

type CollectionReply = { collection?: SaleCollection; error?: string };

function collectionEndpoint(saleId: string) {
  return `/api/sales/${encodeURIComponent(saleId)}/collection`;
}

export async function fetchSaleCollection(saleId: string, signal?: AbortSignal) {
  const response = await fetch(collectionEndpoint(saleId), { cache: "no-store", signal });
  const data = await response.json() as CollectionReply;
  if (!response.ok || !data.collection) throw new Error(data.error ?? "No se pudo cargar el cobro.");
  return data.collection;
}

function initialMode(collection?: SaleCollection) {
  return collection?.hasInstallments ? collection.mode ?? "INSTALLMENTS" : "SINGLE";
}

function collectionPreview(collection: SaleCollection | null, firstDueOn: string, mode: CollectionMode) {
  if (!collection?.canSchedule || !parseCalendarDate(firstDueOn)) return { dues: [], error: "" };
  try {
    const amounts = mode === "INSTALLMENTS" ? collection.installmentAmounts : [collection.paidAmount + collection.balanceDue];
    return { dues: buildCollectionPreview(firstDueOn, amounts, collection.paidAmount, calendarToday()), error: "" };
  } catch (reason) {
    return { dues: [], error: reason instanceof Error ? reason.message : "Revisa las fechas de cobro." };
  }
}

export function SaleCollectionDialog({ saleId, initialCollection, onClose, onSaved }: {
  saleId: string;
  initialCollection?: SaleCollection;
  onClose: () => void;
  onSaved: (collection: SaleCollection) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const submitting = useRef(false);
  const title = useId();
  const [collection, setCollection] = useState<SaleCollection | null>(initialCollection ?? null);
  const [firstDueOn, setFirstDueOn] = useState(initialCollection?.firstDueOn ?? initialCollection?.suggestedDate ?? "");
  const [mode, setMode] = useState<CollectionMode>(() => initialMode(initialCollection));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  useEffect(() => {
    if (initialCollection) return;
    const controller = new AbortController();
    async function load() {
      try {
        const activeCollection = await fetchSaleCollection(saleId, controller.signal);
        if (controller.signal.aborted) return;
        setCollection(activeCollection);
        setFirstDueOn(activeCollection.firstDueOn ?? activeCollection.suggestedDate ?? "");
        setMode(initialMode(activeCollection));
      } catch (reason) {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "No se pudo cargar el cobro.");
      }
    }
    void load();
    return () => controller.abort();
  }, [initialCollection, saleId]);

  const preview = collectionPreview(collection, firstDueOn, mode);

  function close() {
    if (!submitting.current) onClose();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!preview.dues.length || submitting.current) return;
    submitting.current = true;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(collectionEndpoint(saleId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstDueOn, mode }),
      });
      const data = await response.json() as CollectionReply;
      if (!response.ok || !data.collection) throw new Error(data.error ?? "No se pudo programar el cobro.");
      onSaved(data.collection);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo programar el cobro.");
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <dialog ref={ref} aria-labelledby={title} onCancel={(event) => { event.preventDefault(); close(); }}
      className="fixed inset-0 m-auto w-[calc(100%_-_1.5rem)] max-w-lg overflow-hidden rounded-[22px] border border-border bg-white text-foreground shadow-xl backdrop:bg-black/40">
      <form onSubmit={submit} className="flex max-h-[88dvh] flex-col">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><CalendarClock size={20} aria-hidden="true" /></span>
            <div className="min-w-0">
              <h2 id={title} className="text-lg font-bold">{collection?.mode ? "Editar fechas de cobro" : "Programar cobro"}</h2>
              {collection && <p className="truncate text-sm text-muted">{collection.clientName} · {collection.saleNumber}</p>}
            </div>
          </div>
          <button type="button" onClick={close} disabled={saving} aria-label="Cerrar" className="grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-slate-100 disabled:opacity-50"><X size={18} /></button>
        </header>

        <div className="min-h-0 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
          {!collection && !error && <p role="status" className="text-sm text-muted">Cargando datos de la venta…</p>}
          {collection && (collection.canSchedule ? (
            <>
              <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                <p className="text-xs text-muted">Saldo de la venta</p>
                <p className="text-lg font-bold tabular-nums">{formatCurrency(collection.balanceDue)}</p>
              </div>
              {collection.hasInstallments && <label className="block text-sm font-semibold">
                Forma de cobro
                <select value={mode} onChange={(event) => setMode(event.currentTarget.value as CollectionMode)} disabled={saving} className="dashboard-field mt-1.5">
                  <option value="INSTALLMENTS">Usar las cuotas de la cotización</option>
                  <option value="SINGLE">Cobrar todo el saldo en una fecha</option>
                </select>
              </label>}
              <label className="block text-sm font-semibold">
                {mode === "INSTALLMENTS" ? "Fecha del primer vencimiento acordado" : "¿Cuándo paga el cliente?"}
                <input type="date" value={firstDueOn} onChange={(event) => setFirstDueOn(event.currentTarget.value)} disabled={saving} className="dashboard-field mt-1.5" required />
              </label>
              {mode === "INSTALLMENTS" && <p className="text-xs text-muted">Las siguientes cuotas serán mensuales. Los abonos ya registrados se descuentan desde la primera cuota.</p>}
              {preview.dues.length > 0 && <div className="space-y-2"><h3 className="text-sm font-semibold">Vista previa</h3><SaleCollectionDues dues={preview.dues} /></div>}
            </>
          ) : <p className="text-sm text-muted">Esta venta ya no tiene saldo pendiente.</p>)}
          {(error || preview.error) && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error || preview.error}</p>}
        </div>

        <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-border px-4 py-3 sm:px-5">
          <button type="button" onClick={close} disabled={saving} className="min-h-10 rounded-full border border-border px-4 text-sm font-semibold disabled:opacity-50">{collection?.mode ? "Cancelar" : "Ahora no"}</button>
          {collection?.canSchedule && <button type="submit" disabled={saving || !preview.dues.length} className="min-h-10 rounded-full bg-primary px-4 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Guardando…" : "Guardar fechas"}</button>}
        </footer>
      </form>
    </dialog>
  );
}
