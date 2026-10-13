"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { DashboardPageHeader } from "@/components/admin/DashboardPageHeader";
import { DashboardSuccessToast } from "@/components/admin/DashboardSuccessToast";
import { SaleInvoiceModal } from "@/components/admin/SaleInvoiceModal";
import { SalePaymentModal } from "@/components/admin/SalePaymentModal";
import { formatCurrency } from "@/lib/orders/service";
import { type SaleInternalCommentRecord } from "@/lib/sales/comments";
import {
  getSaleCollectionStatusLabel,
  getSalePaymentMethodLabel,
  getSaleStatusLabel,
  type SaleRecord,
} from "@/lib/sales/types";

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("es-CL", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(date);
}

const panelClass = "rounded-[24px] border border-border bg-white p-5 shadow-[0_18px_46px_rgba(16,16,36,0.04)] sm:p-6";
const labelClass = "text-xs font-medium uppercase tracking-[0.14em] text-muted";

export function SaleDetail({ initialSale }: { initialSale: SaleRecord }) {
  const [sale, setSale] = useState(initialSale);
  const [comments, setComments] = useState<SaleInternalCommentRecord[]>([]);
  const [comment, setComment] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentSaving, setCommentSaving] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const refreshComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/sales/${encodeURIComponent(sale.id)}/comments`, { cache: "no-store" });
      const data = await response.json() as { comments?: SaleInternalCommentRecord[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "No se pudieron cargar los comentarios.");
      setComments(data.comments ?? []);
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : "No se pudieron cargar los comentarios.");
    } finally {
      setCommentsLoading(false);
    }
  }, [sale.id]);

  useEffect(() => { void refreshComments(); }, [refreshComments]);

  async function saveComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!comment.trim()) return;
    setCommentSaving(true);
    setCommentError("");
    try {
      const response = await fetch(`/api/sales/${encodeURIComponent(sale.id)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: comment }),
      });
      const data = await response.json() as { comment?: SaleInternalCommentRecord; error?: string };
      if (!response.ok || !data.comment) throw new Error(data.error ?? "No se pudo guardar el comentario.");
      setComments((current) => [data.comment!, ...current]);
      setComment("");
      setSuccessMessage("Comentario interno guardado.");
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : "No se pudo guardar el comentario.");
    } finally {
      setCommentSaving(false);
    }
  }

  const receipts = sale.payments.filter((payment) => payment.receiptPath);
  if (!receipts.length && sale.receiptPath) {
    receipts.push({
      id: `${sale.id}-receipt`, saleId: sale.id, amount: sale.paidAmount,
      method: sale.paymentMethod ?? "other", paidAt: sale.soldAt,
      receiptPath: sale.receiptPath, receiptFileName: sale.receiptFileName,
      orderId: sale.orderId, source: "MANUAL", createdByEmail: sale.createdByEmail, observation: "",
    });
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        icon="ventas"
        eyebrow="Detalle de venta"
        title={sale.number}
        action={{ label: "Volver a ventas", href: "/dashboard/ventas", icon: "back", variant: "secondary" }}
        trailing={<span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold">{getSaleStatusLabel(sale.status)}</span>}
      />

      <section className={panelClass} aria-labelledby="sale-summary-heading">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={labelClass}>Cliente</p>
            <h2 id="sale-summary-heading" className="mt-2 text-xl font-bold">{sale.clientCompany}</h2>
            <p className="mt-1 text-sm text-muted">{sale.clientName}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {sale.status !== "CANCELLED" && sale.balanceDue > 0 ? (
              <button type="button" onClick={() => setPaymentOpen(true)} className="min-h-10 rounded-full border border-border px-4 text-sm font-semibold hover:border-primary/30 hover:text-primary">Registrar abono</button>
            ) : null}
            {sale.liorenInvoice.status === "ISSUED" ? (
              <span className="inline-flex min-h-10 items-center rounded-full bg-emerald-100 px-4 text-sm font-semibold text-emerald-700">Factura emitida{sale.liorenInvoice.folio ? ` · folio ${sale.liorenInvoice.folio}` : ""}</span>
            ) : sale.status !== "CANCELLED" ? (
              <button type="button" onClick={() => setInvoiceOpen(true)} className="min-h-10 rounded-full bg-gradient-to-r from-primary to-magenta px-4 text-sm font-semibold text-white">{sale.liorenInvoice.status === "ERROR" ? "Revisar factura" : "Emitir factura"}</button>
            ) : null}
          </div>
        </div>
        <div className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <div><p className={labelClass}>Fecha de venta</p><p className="mt-1.5 text-sm font-medium">{formatDate(sale.soldAt)}</p></div>
          <div><p className={labelClass}>Medio de pago</p><p className="mt-1.5 text-sm font-medium">{getSalePaymentMethodLabel(sale.paymentMethod)}</p></div>
          <div><p className={labelClass}>Ejecutivo</p><p className="mt-1.5 text-sm font-medium">{sale.executiveName}</p></div>
          <div><p className={labelClass}>Registrada por</p><p className="mt-1.5 break-all text-sm font-medium">{sale.createdByEmail}</p></div>
          <div><p className={labelClass}>Origen</p><p className="mt-1.5 text-sm font-medium">{sale.source === "MANUAL" ? "Registro manual" : sale.source === "QUOTE_ACCEPTED" ? "Cotización aceptada" : sale.source === "ORDER_PAID" ? "Orden pagada" : "API externa"}</p></div>
          <div><p className={labelClass}>Cotización / orden</p><p className="mt-1.5 text-sm font-medium">
            {sale.quoteId && sale.quoteNumber ? <Link className="text-primary hover:underline" href={`/dashboard/cotizaciones/${sale.quoteId}`}>{sale.quoteNumber}</Link>
              : sale.orderId ? <Link className="text-primary hover:underline" href={`/dashboard/compras/${sale.orderId}`}>{sale.orderId}</Link> : "Venta directa"}
          </p></div>
          {sale.externalReference ? <div><p className={labelClass}>Referencia externa</p><p className="mt-1.5 text-sm font-medium">{sale.externalReference}</p></div> : null}
          {sale.liorenInvoice.status === "ISSUED" ? <div><p className={labelClass}>Documento tributario</p><p className="mt-1.5 text-sm font-medium">Tipo {sale.liorenInvoice.type} · folio {sale.liorenInvoice.folio ?? "—"}<br />{formatDate(sale.liorenInvoice.issuedAt)}</p></div> : null}
        </div>
        {sale.observation ? <div className="mt-5 rounded-2xl bg-slate-50 p-4"><p className={labelClass}>Observación de la venta</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{sale.observation}</p></div> : null}
        {sale.liorenInvoice.error ? <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">Factura: {sale.liorenInvoice.error}</p> : null}
      </section>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Resumen de montos">
        {[["Total", sale.total], ["Pagado", sale.paidAmount], ["Saldo", sale.balanceDue]].map(([label, value]) => (
          <div key={String(label)} className={panelClass}><p className="text-sm text-muted">{label}</p><p className="mt-1 text-2xl font-bold tracking-[-0.04em]">{formatCurrency(Number(value))}</p>{label === "Saldo" ? <p className="mt-1 text-xs text-muted">{getSaleCollectionStatusLabel(sale.collectionStatus)}</p> : null}</div>
        ))}
      </section>

      <section className={panelClass} aria-labelledby="payments-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div><p className={labelClass}>Historial</p><h2 id="payments-heading" className="mt-1 text-lg font-bold">Pagos y comprobantes</h2></div>
          <p className="text-sm text-muted">{sale.payments.length} {sale.payments.length === 1 ? "pago" : "pagos"}</p>
        </div>
        {sale.payments.length ? (
          <div className="mt-4 divide-y divide-border">
            {sale.payments.map((payment) => (
              <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
                <div><p className="font-semibold">{formatCurrency(payment.amount)} <span className="font-normal text-muted">· {getSalePaymentMethodLabel(payment.method)}</span></p><p className="mt-1 text-xs text-muted">{formatDate(payment.paidAt)} · {payment.createdByEmail || "Pago asociado a la venta"}</p>{payment.observation ? <p className="mt-1 text-sm text-muted">{payment.observation}</p> : null}</div>
                {payment.receiptPath ? <a href={payment.receiptPath} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-full border border-border px-4 text-xs font-semibold hover:border-primary/30 hover:text-primary">Ver comprobante{payment.receiptFileName ? ` · ${payment.receiptFileName}` : ""}</a> : <span className="text-sm text-muted">Sin comprobante adjunto</span>}
              </div>
            ))}
          </div>
        ) : receipts.length ? <a className="mt-4 inline-flex min-h-10 items-center rounded-full border border-border px-4 text-sm font-semibold" href={receipts[0].receiptPath} target="_blank" rel="noreferrer">Ver comprobante{receipts[0].receiptFileName ? ` · ${receipts[0].receiptFileName}` : ""}</a>
          : <p className="mt-4 text-sm text-muted">Esta venta todavía no tiene pagos ni comprobantes adjuntos.</p>}
      </section>

      <section className={panelClass} aria-labelledby="internal-comments-heading">
        <p className={labelClass}>Solo equipo SmartPro</p>
        <h2 id="internal-comments-heading" className="mt-1 text-lg font-bold">Comentarios internos</h2>
        <form onSubmit={saveComment} className="mt-4 space-y-3">
          <label className="sr-only" htmlFor="sale-internal-comment">Agregar un comentario interno</label>
          <textarea id="sale-internal-comment" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={2000} rows={3} className="dashboard-field min-h-24 resize-y" placeholder="Deja una nota para el equipo…" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-muted">{comment.length}/2000 caracteres. Solo visible en el panel.</span>
            <button type="submit" disabled={!comment.trim() || commentSaving} className="min-h-10 rounded-full bg-gradient-to-r from-primary to-magenta px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{commentSaving ? "Guardando…" : "Agregar comentario"}</button>
          </div>
        </form>
        {commentError ? <p role="alert" className="mt-3 text-sm text-rose-700">{commentError}</p> : null}
        <div className="mt-5 space-y-3">
          {commentsLoading ? <p className="text-sm text-muted">Cargando comentarios…</p> : comments.length ? comments.map((entry) => (
            <article key={entry.id} className="rounded-2xl bg-slate-50 p-4">
              <div className="flex flex-wrap justify-between gap-2"><p className="break-all text-sm font-semibold">{entry.authorEmail}</p><time className="text-xs text-muted" dateTime={entry.createdAt}>{formatDate(entry.createdAt)}</time></div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{entry.body}</p>
            </article>
          )) : <p className="text-sm text-muted">Todavía no hay comentarios internos para esta venta.</p>}
        </div>
      </section>

      <SalePaymentModal sale={paymentOpen ? sale : null} onClose={() => setPaymentOpen(false)} onSaved={(updated) => {
        setSale(updated); setPaymentOpen(false); setSuccessMessage(`Abono registrado en ${updated.number}.`);
      }} />
      <SaleInvoiceModal sale={invoiceOpen ? sale : null} onClose={() => setInvoiceOpen(false)} onIssued={(updated) => {
        setSale(updated); setInvoiceOpen(false); setSuccessMessage(`Factura emitida para ${updated.number}.`);
      }} onFailed={(updated) => { setSale(updated); setInvoiceOpen(true); }} />
      {successMessage ? <DashboardSuccessToast message={successMessage} onDismiss={() => setSuccessMessage("")} /> : null}
    </div>
  );
}
