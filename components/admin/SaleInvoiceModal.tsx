"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, X, Trash2 } from "lucide-react";

import { formatCurrency } from "@/lib/orders/service";
import type { LiorenInvoiceDraft, LiorenInvoiceDetail, SaleRecord } from "@/lib/sales/types";

type SaleInvoiceModalProps = {
  sale: SaleRecord | null;
  onClose: () => void;
  onIssued: (sale: SaleRecord) => void;
  onFailed?: (sale: SaleRecord) => void;
};

function emptyDetail(): LiorenInvoiceDetail {
  return { codigo: "SRV", nombre: "", cantidad: 1, unidad: "UN", precio: 0, exento: false };
}

export function SaleInvoiceModal({ sale, onClose, onIssued, onFailed }: SaleInvoiceModalProps) {
  const [draft, setDraft] = useState<LiorenInvoiceDraft | null>(null);
  const [configured, setConfigured] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const issuingRef = useRef(false);

  useEffect(() => {
    if (!sale) {
      setDraft(null);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError("");
    void fetch(`/api/sales/${encodeURIComponent(sale.id)}/invoice`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({})) as { draft?: LiorenInvoiceDraft; configured?: boolean; error?: string };
        if (!response.ok || !data.draft) throw new Error(data.error ?? "No se pudieron cargar los datos de facturación.");
        if (cancelled) return;
        setDraft(data.draft);
        setConfigured(Boolean(data.configured));
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "No se pudieron cargar los datos de facturación.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [sale]);

  const totals = useMemo(() => {
    const net = draft?.detalles.reduce((sum, item) => sum + item.cantidad * item.precio, 0) ?? 0;
    const taxable = draft?.detalles.reduce((sum, item) => sum + (item.exento ? 0 : item.cantidad * item.precio), 0) ?? 0;
    const tax = Math.round(taxable * 0.19);
    return { net, tax, total: Math.round(net + tax) };
  }, [draft]);

  if (!sale) return null;

  function updateDraft(updater: (current: LiorenInvoiceDraft) => LiorenInvoiceDraft) {
    setDraft((current) => current ? updater(current) : current);
  }

  function updateReceiver(field: keyof LiorenInvoiceDraft["receptor"], value: string) {
    updateDraft((current) => ({ ...current, receptor: { ...current.receptor, [field]: value } }));
  }

  function updateDetail(index: number, field: keyof LiorenInvoiceDetail, value: string | number | boolean) {
    updateDraft((current) => ({
      ...current,
      detalles: current.detalles.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
    }));
  }

  async function issue() {
    if (!sale || !draft || issuingRef.current) return;
    issuingRef.current = true;
    setIsIssuing(true);
    setError("");
    try {
      const response = await fetch(`/api/sales/${encodeURIComponent(sale.id)}/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft }),
      });
      const data = await response.json().catch(() => ({})) as { sale?: SaleRecord | null; error?: string };
      if (!response.ok || !data.sale) {
        if (data.sale && (data.sale.liorenInvoice.status !== sale.liorenInvoice.status || data.sale.liorenInvoice.error !== sale.liorenInvoice.error)) {
          onFailed?.(data.sale);
        }
        throw new Error(data.error ?? "No se pudo emitir la factura.");
      }
      onIssued(data.sale);
      onClose();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "No se pudo emitir la factura.");
    } finally {
      issuingRef.current = false;
      setIsIssuing(false);
    }
  }

  const matchesTotal = Math.abs(totals.total - sale.total) <= 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-3 sm:p-4" role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="sale-invoice-title" className="flex max-h-[min(94vh,900px)] w-full max-w-4xl flex-col overflow-hidden rounded-[26px] border border-border bg-white shadow-[0_24px_64px_rgba(16,16,36,0.20)]">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Venta {sale.number}</p>
            <h2 id="sale-invoice-title" className="mt-1 text-2xl font-bold tracking-[-0.05em] text-foreground">Revisar factura</h2>
            <p className="mt-1 text-sm text-muted">Revisa y edita estos datos. Lioren emitirá el documento al SII solo cuando confirmes.</p>
          </div>
          <button type="button" onClick={onClose} disabled={isIssuing} aria-label="Cerrar" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-muted hover:text-primary disabled:opacity-50"><X size={18} /></button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4 sm:px-6">
          {isLoading ? <p className="text-sm text-muted">Cargando datos del cliente…</p> : null}
          {!configured ? <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">Configura LIOREN_API_BASE_URL y LIOREN_API_TOKEN en el servidor. Puedes revisar los datos, pero la emisión está deshabilitada.</p> : null}
          {sale.liorenInvoice.status === "ERROR" && sale.liorenInvoice.error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Último intento: {sale.liorenInvoice.error}</p> : null}

          {draft ? <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="block"><span className="mb-1.5 block text-sm font-semibold">Tipo de factura</span><div className="dashboard-field flex items-center text-sm font-medium">Factura afecta con IVA (33)</div></div>
              <label className="block"><span className="mb-1.5 block text-sm font-semibold">Fecha de emisión</span><input type="date" value={draft.fecha} onChange={(event) => updateDraft((current) => ({ ...current, fecha: event.target.value }))} className="dashboard-field" disabled={isIssuing} /></label>
              <label className="block"><span className="mb-1.5 block text-sm font-semibold">Vencimiento (opcional)</span><input type="date" value={draft.vencimiento} onChange={(event) => updateDraft((current) => ({ ...current, vencimiento: event.target.value }))} className="dashboard-field" disabled={isIssuing} /></label>
            </div>

            <section className="space-y-3 rounded-[20px] border border-border bg-slate-50/80 p-4">
              <div><p className="font-semibold">Datos tributarios del receptor</p><p className="text-xs text-muted">Los códigos numéricos de ciudad y comuna se consultan en Lioren.</p></div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="block"><span className="mb-1 block text-xs font-semibold">RUT</span><input value={draft.receptor.rut} onChange={(event) => updateReceiver("rut", event.target.value)} className="dashboard-field" disabled={isIssuing} /></label>
                <label className="block"><span className="mb-1 block text-xs font-semibold">Razón social</span><input value={draft.receptor.rs} onChange={(event) => updateReceiver("rs", event.target.value)} maxLength={100} className="dashboard-field" disabled={isIssuing} /></label>
                <label className="block"><span className="mb-1 block text-xs font-semibold">Giro</span><input value={draft.receptor.giro} onChange={(event) => updateReceiver("giro", event.target.value)} maxLength={40} className="dashboard-field" disabled={isIssuing} /></label>
                <label className="block"><span className="mb-1 block text-xs font-semibold">Comuna (código Lioren)</span><input inputMode="numeric" value={draft.receptor.comuna} onChange={(event) => updateReceiver("comuna", event.target.value)} className="dashboard-field" disabled={isIssuing} /></label>
                <label className="block"><span className="mb-1 block text-xs font-semibold">Ciudad (código Lioren)</span><input inputMode="numeric" value={draft.receptor.ciudad} onChange={(event) => updateReceiver("ciudad", event.target.value)} className="dashboard-field" disabled={isIssuing} /></label>
                <label className="block"><span className="mb-1 block text-xs font-semibold">Dirección tributaria</span><input value={draft.receptor.direccion} onChange={(event) => updateReceiver("direccion", event.target.value)} maxLength={70} className="dashboard-field" disabled={isIssuing} /></label>
                <label className="block"><span className="mb-1 block text-xs font-semibold">Correo</span><input type="email" value={draft.receptor.email} onChange={(event) => updateReceiver("email", event.target.value)} maxLength={80} className="dashboard-field" disabled={isIssuing} /></label>
                <label className="block"><span className="mb-1 block text-xs font-semibold">Teléfono</span><input value={draft.receptor.telefono} onChange={(event) => updateReceiver("telefono", event.target.value)} className="dashboard-field" disabled={isIssuing} /></label>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3"><div><p className="font-semibold">Detalle facturado</p><p className="text-xs text-muted">Puedes editar o agregar hasta 60 ítems.</p></div><button type="button" onClick={() => updateDraft((current) => ({ ...current, detalles: [...current.detalles, emptyDetail()] }))} disabled={isIssuing || draft.detalles.length >= 60} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-border px-3 text-xs font-semibold hover:text-primary disabled:opacity-50"><Plus size={14} /> Agregar ítem</button></div>
              {draft.detalles.map((item, index) => <div key={index} className="grid gap-2 rounded-2xl border border-border p-3 sm:grid-cols-12">
                <label className="block sm:col-span-5"><span className="mb-1 block text-xs font-semibold">Descripción</span><input value={item.nombre} onChange={(event) => updateDetail(index, "nombre", event.target.value)} maxLength={80} className="dashboard-field" disabled={isIssuing} /></label>
                <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-semibold">Cantidad</span><input type="number" min="0.000001" step="any" value={item.cantidad} onChange={(event) => updateDetail(index, "cantidad", Number(event.target.value))} className="dashboard-field" disabled={isIssuing} /></label>
                <label className="block sm:col-span-3"><span className="mb-1 block text-xs font-semibold">Precio neto unitario</span><input type="number" min="0" step="1" value={item.precio} onChange={(event) => updateDetail(index, "precio", Number(event.target.value))} className="dashboard-field" disabled={isIssuing} /></label>
                <div className="flex items-end pb-2 text-xs font-semibold text-emerald-700 sm:col-span-1">Afecto a IVA</div>
                <button type="button" aria-label="Quitar ítem" onClick={() => updateDraft((current) => ({ ...current, detalles: current.detalles.filter((_, itemIndex) => itemIndex !== index) }))} disabled={isIssuing || draft.detalles.length <= 1} className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted hover:text-red-600 disabled:opacity-40"><Trash2 size={16} /></button>
              </div>)}
            </section>

            <label className="block"><span className="mb-1.5 block text-sm font-semibold">Observaciones (opcional)</span><textarea value={draft.observaciones} onChange={(event) => updateDraft((current) => ({ ...current, observaciones: event.target.value.slice(0, 250) }))} maxLength={250} className="dashboard-field min-h-20 resize-y" disabled={isIssuing} /></label>
            <div className="ml-auto max-w-sm space-y-1 rounded-2xl bg-slate-50 p-4 text-sm"><div className="flex justify-between"><span>Neto</span><span>{formatCurrency(totals.net)}</span></div><div className="flex justify-between"><span>IVA estimado (19%)</span><span>{formatCurrency(totals.tax)}</span></div><div className="flex justify-between border-t border-border pt-2 font-bold"><span>Total factura</span><span>{formatCurrency(totals.total)}</span></div><p className={`pt-1 text-xs ${matchesTotal ? "text-emerald-700" : "text-amber-800"}`}>{matchesTotal ? "Coincide con la venta." : `Debe coincidir con la venta: ${formatCurrency(sale.total)}.`}</p>{sale.tax === 0 ? <p className="pt-1 text-xs text-muted">El total registrado se considera IVA incluido; el neto se calcula para emitir factura afecta.</p> : null}</div>
          </> : null}
        </div>

        <div className="shrink-0 space-y-3 border-t border-border px-5 py-4 sm:px-6">
          {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p> : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={isIssuing} className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold disabled:opacity-50">Cancelar</button><button type="button" onClick={() => void issue()} disabled={isLoading || isIssuing || !configured || !draft || !matchesTotal} className="min-h-11 rounded-full bg-gradient-to-r from-primary to-magenta px-5 text-sm font-semibold text-white disabled:opacity-60">{isIssuing ? "Enviando a Lioren…" : "Confirmar y emitir factura"}</button></div>
        </div>
      </div>
    </div>
  );
}
