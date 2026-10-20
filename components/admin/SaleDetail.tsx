"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  type SalePaymentRecord,
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
  const router = useRouter();
  const [sale, setSale] = useState(initialSale);
  const [comments, setComments] = useState<SaleInternalCommentRecord[]>([]);
  const [comment, setComment] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentSaving, setCommentSaving] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<SalePaymentRecord | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceEmailSending, setInvoiceEmailSending] = useState(false);
  const [archiveBusy, setArchiveBusy] = useState(false);
  const [archiveError, setArchiveError] = useState("");
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

  async function resendInvoiceEmail() {
    setInvoiceEmailSending(true);
    try {
      const response = await fetch(`/api/sales/${encodeURIComponent(sale.id)}/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend_email" }),
      });
      const data = await response.json() as { sale?: SaleRecord; error?: string };
      if (!response.ok || !data.sale) throw new Error(data.error ?? "No se pudo enviar la factura por correo.");
      setSale(data.sale);
      setSuccessMessage(data.sale.liorenInvoice.emailError ? "La factura sigue emitida, pero el correo no pudo enviarse." : "Factura enviada al cliente y a contacto@smartpro.cl.");
    } catch (error) {
      setSuccessMessage(error instanceof Error ? error.message : "No se pudo enviar la factura por correo.");
    } finally {
      setInvoiceEmailSending(false);
    }
  }

  async function toggleArchive() {
    const restoring = Boolean(sale.archivedAt);
    const message = restoring
      ? `¿Restaurar ${sale.number} a la lista de ventas?`
      : `¿Ocultar ${sale.number} de la lista y de los totales? La factura electrónica ${sale.liorenInvoice.folio ?? "emitida"} se conservará y seguirá vigente.`;
    if (!window.confirm(message)) return;

    setArchiveBusy(true);
    setArchiveError("");
    try {
      const response = await fetch(`/api/sales/${encodeURIComponent(sale.id)}`, { method: restoring ? "PATCH" : "DELETE" });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? (restoring ? "No se pudo restaurar la venta." : "No se pudo ocultar la venta."));
      if (!restoring) {
        router.replace("/dashboard/ventas");
        router.refresh();
        return;
      }
      setSale((current) => ({ ...current, archivedAt: null, archivedByEmail: null, archiveReason: null }));
      setSuccessMessage("Venta restaurada a la lista.");
    } catch (error) {
      setArchiveError(error instanceof Error ? error.message : "No se pudo actualizar la venta.");
    } finally {
      setArchiveBusy(false);
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
        trailing={<span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold">{sale.archivedAt ? "Oculta" : getSaleStatusLabel(sale.status)}</span>}
      />

      <section className={panelClass} aria-labelledby="sale-summary-heading">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={labelClass}>Cliente</p>
            <h2 id="sale-summary-heading" className="mt-2 text-xl font-bold">{sale.clientCompany}</h2>
            <p className="mt-1 text-sm text-muted">{sale.clientName}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {sale.archivedAt ? (
              <button type="button" onClick={() => void toggleArchive()} disabled={archiveBusy} className="min-h-10 rounded-full border border-border px-4 text-sm font-semibold disabled:opacity-50">{archiveBusy ? "Restaurando…" : "Restaurar a ventas"}</button>
            ) : /\bprueba\b/i.test(sale.observation) && sale.paidAmount === 0 ? (
              <button type="button" onClick={() => void toggleArchive()} disabled={archiveBusy} className="min-h-10 rounded-full border border-amber-300 px-4 text-sm font-semibold text-amber-800 disabled:opacity-50">{archiveBusy ? "Ocultando…" : "Ocultar venta de prueba"}</button>
            ) : null}
            {!sale.archivedAt && sale.status !== "CANCELLED" && sale.balanceDue > 0 ? (
              <button type="button" onClick={() => setPaymentOpen(true)} className="min-h-10 rounded-full border border-border px-4 text-sm font-semibold hover:border-primary/30 hover:text-primary">Registrar abono</button>
            ) : null}
            {sale.liorenInvoice.status === "ISSUED" ? (
              <>
                <span className="inline-flex min-h-10 items-center rounded-full bg-emerald-100 px-4 text-sm font-semibold text-emerald-700">Factura emitida{sale.liorenInvoice.folio ? ` · folio ${sale.liorenInvoice.folio}` : ""}</span>
                {sale.liorenInvoice.pdfAvailable ? <a href={`/api/sales/${encodeURIComponent(sale.id)}/invoice?format=pdf`} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-full border border-border px-4 text-sm font-semibold hover:text-primary">Ver factura PDF</a> : null}
                {!sale.archivedAt ? <button type="button" onClick={() => void resendInvoiceEmail()} disabled={invoiceEmailSending || !sale.liorenInvoice.pdfAvailable} className="inline-flex min-h-10 items-center rounded-full border border-border px-4 text-sm font-semibold hover:text-primary disabled:opacity-50">{invoiceEmailSending ? "Enviando…" : sale.liorenInvoice.emailError ? "Reintentar envío" : "Reenviar factura por correo"}</button> : null}
              </>
            ) : !sale.archivedAt && sale.status !== "CANCELLED" ? (
              <button type="button" onClick={() => setInvoiceOpen(true)} className="min-h-10 rounded-full bg-gradient-to-r from-primary to-magenta px-4 text-sm font-semibold text-white">{sale.liorenInvoice.status === "ERROR" ? "Revisar factura" : "Emitir factura"}</button>
            ) : null}
          </div>
        </div>
        {archiveError ? <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{archiveError}</p> : null}
        {sale.archivedAt ? <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Oculta de la lista el {formatDate(sale.archivedAt)} · motivo: {sale.archiveReason || "Venta de prueba"}. La factura se conserva.</p> : null}
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
        {sale.liorenInvoice.status === "ISSUED" ? <p className={`mt-4 rounded-xl p-3 text-sm ${sale.liorenInvoice.emailError ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-800"}`}>{sale.liorenInvoice.emailError ? `Correo pendiente: ${sale.liorenInvoice.emailError}` : sale.liorenInvoice.emailSentAt ? `Factura enviada al cliente y con copia a contacto@smartpro.cl el ${formatDate(sale.liorenInvoice.emailSentAt)}.` : "La factura todavía no se ha enviado por correo."}</p> : null}
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
          <div className="mt-4 space-y-3">
            {sale.payments.map((payment) => (
              <article key={payment.id} className="rounded-2xl border border-border bg-slate-50/70 p-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.1fr_0.8fr_1fr_1.4fr_auto]">
                  <div><p className={labelClass}>Fecha</p><p className="mt-1 text-sm font-medium">{formatDate(payment.paidAt)}</p></div>
                  <div><p className={labelClass}>Monto</p><p className="mt-1 text-sm font-semibold">{formatCurrency(payment.amount)}</p></div>
                  <div><p className={labelClass}>Medio</p><p className="mt-1 text-sm font-medium">{getSalePaymentMethodLabel(payment.method)}</p></div>
                  <div><p className={labelClass}>Descripción</p><p className="mt-1 whitespace-pre-wrap text-sm">{payment.observation || "—"}</p></div>
                  <div className="flex flex-wrap items-end gap-2 lg:justify-end">
                    {payment.receiptPath ? <a href={payment.receiptPath} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center rounded-full border border-border bg-white px-3 text-xs font-semibold hover:border-primary/30 hover:text-primary">Ver archivo{payment.receiptFileName ? ` · ${payment.receiptFileName}` : ""}</a> : <span className="text-xs text-muted">Sin archivo</span>}
                    {!sale.archivedAt && sale.status !== "CANCELLED" ? <button type="button" onClick={() => setEditingPayment(payment)} className="inline-flex min-h-9 items-center rounded-full bg-white px-3 text-xs font-semibold text-primary ring-1 ring-border hover:ring-primary/40">Editar</button> : null}
                  </div>
                </div>
                <p className="mt-3 border-t border-border/70 pt-2 text-xs text-muted">Registrado por {payment.createdByEmail || "pago asociado a la venta"}</p>
              </article>
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

      <SalePaymentModal sale={paymentOpen || editingPayment ? sale : null} payment={editingPayment} onClose={() => { setPaymentOpen(false); setEditingPayment(null); }} onSaved={(updated) => {
        const wasEditing = Boolean(editingPayment);
        setSale(updated); setPaymentOpen(false); setEditingPayment(null);
        setSuccessMessage(wasEditing ? "Pago y comprobante actualizados." : `Abono registrado en ${updated.number}.`);
      }} />
      <SaleInvoiceModal sale={invoiceOpen ? sale : null} onClose={() => setInvoiceOpen(false)} onIssued={(updated) => {
        setSale(updated); setInvoiceOpen(false); setSuccessMessage(`Factura emitida para ${updated.number}.`);
      }} onFailed={(updated) => { setSale(updated); setInvoiceOpen(true); }} />
      {successMessage ? <DashboardSuccessToast message={successMessage} onDismiss={() => setSuccessMessage("")} /> : null}
    </div>
  );
}
