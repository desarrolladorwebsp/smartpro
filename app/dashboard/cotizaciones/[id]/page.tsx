import { Suspense } from "react";
import Link from "next/link";

import { DashboardDataError } from "@/components/admin/DashboardDataError";
import { DashboardPageHeader } from "@/components/admin/DashboardPageHeader";
import { QuoteDetailPageSkeleton } from "@/components/admin/dashboard-skeletons";
import { QuoteCommercialTerms } from "@/components/admin/QuoteCommercialTerms";
import { QuoteDetailActions } from "@/components/admin/QuoteDetailActions";
import { requireAdminSession } from "@/lib/auth";
import { formatCurrency } from "@/lib/orders/service";
import { getQuoteById } from "@/lib/quotes/repository";
import { getQuoteStatusLabel, type QuoteRecord, type QuoteStatus } from "@/lib/quotes/types";

export const dynamic = "force-dynamic";

const statusStyles: Record<QuoteStatus, string> = {
  DRAFT: "bg-slate-200 text-slate-700",
  CREATED: "bg-sky-100 text-sky-700",
  SENT: "bg-violet-100 text-violet-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Santiago",
  }).format(date);
}

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<QuoteDetailPageSkeleton />}>
      <QuoteDetailContent params={params} />
    </Suspense>
  );
}

async function QuoteDetailContent({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();

  let quote: QuoteRecord | null = null;
  let loadError = false;

  try {
    const { id } = await params;
    quote = await getQuoteById(id);
  } catch (error) {
    console.error("[smartpro:dashboard:cotizaciones:detalle] Error de conexión a la base de datos", error);
    loadError = true;
  }

  if (loadError) {
    return (
      <DashboardDataError
        icon="cotizaciones"
        eyebrow="Cotización"
        title="Detalle"
        message="No se pudo cargar la cotización."
      />
    );
  }

  if (!quote) {
    return (
      <div className="rounded-[26px] border border-dashed border-border bg-white p-8 text-center shadow-[0_18px_46px_rgba(16,16,36,0.04)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">Cotización</p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-0.05em] text-foreground">No se encontró la cotización</h1>
        <Link
          href="/dashboard/cotizaciones"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-r from-primary to-magenta px-5 text-sm font-semibold text-white"
        >
          Volver a cotizaciones
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        icon="cotizaciones"
        eyebrow="Cotización"
        title={quote.number}
        action={{ label: "Volver", href: "/dashboard/cotizaciones", icon: "back", variant: "secondary" }}
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="space-y-5 rounded-[26px] border border-border bg-white p-5 shadow-[0_18px_46px_rgba(16,16,36,0.04)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Detalle comercial</p>
              <h2 className="mt-2 text-xl font-bold tracking-[-0.05em] text-foreground">Servicios cotizados</h2>
            </div>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[quote.status]}`}>
              {getQuoteStatusLabel(quote.status)}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoBlock label="Emisión" value={formatDate(quote.createdAt)} />
            <InfoBlock label="Vencimiento" value={formatDate(quote.validUntil)} />
            <InfoBlock label="Plazo de entrega" value={`${quote.deliveryBusinessDays} días hábiles`} />
            <InfoBlock label="Pago inicial" value={`${quote.initialPaymentPercent}%`} />
            <InfoBlock label="Cliente" value={quote.clientCompany} />
            <InfoBlock label="Contacto" value={quote.clientName || "—"} />
            <InfoBlock label="Correo" value={quote.clientEmail || "—"} />
            <InfoBlock label="RUT" value={quote.clientRut || "—"} />
          </div>

          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="min-w-full text-left text-sm text-foreground">
              <thead className="bg-navy text-[11px] uppercase tracking-[0.16em] text-white">
                <tr>
                  <th className="px-4 py-3 font-medium">Servicio / Plan</th>
                  <th className="px-4 py-3 font-medium text-right">Cantidad</th>
                  <th className="px-4 py-3 font-medium text-right">Precio</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item) => (
                  <tr key={item.id} className="border-t border-border bg-white">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{item.planName}</p>
                      <p className="text-xs text-muted">
                        {item.categoryName}
                        {item.subcategoryName ? ` · ${item.subcategoryName}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-border bg-slate-50 p-4 text-sm">
            <div className="flex items-center justify-between text-muted">
              <span>Subtotal</span>
              <span>{formatCurrency(quote.subtotal)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-muted">
              <span>IVA</span>
              <span>{formatCurrency(quote.tax)}</span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-base font-bold text-foreground">
              <span>Total</span>
              <span>{formatCurrency(quote.total)}</span>
            </div>
          </div>

          {quote.notes ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Observaciones</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">{quote.notes}</p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-border bg-slate-50/80 p-4">
            <QuoteCommercialTerms quote={quote} />
          </div>
        </section>

        <QuoteDetailActions quote={quote} />
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-slate-50/80 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
