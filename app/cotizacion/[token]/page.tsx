import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { QuoteCommercialTerms } from "@/components/admin/QuoteCommercialTerms";
import { QuotePaymentActions } from "@/components/quotes/QuotePaymentActions";
import { SMARTPRO_COMPANY } from "@/lib/quotes/company";
import { getQuotePaymentBlockReason } from "@/lib/quotes/checkout";
import { getQuoteForAccessToken } from "@/lib/quotes/pay";
import { formatCurrency } from "@/lib/orders/service";
import { getSaleByQuoteId } from "@/lib/sales/repository";

export const dynamic = "force-dynamic";

type QuotePublicPageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ pago?: string | string[] }>;
};

const UNAVAILABLE_METADATA: Metadata = {
  title: "Cotización",
  robots: { index: false, follow: false },
};

export async function generateMetadata({ params }: QuotePublicPageProps): Promise<Metadata> {
  const { token } = await params;
  const quote = await getQuoteForAccessToken(decodeURIComponent(token)).catch(() => null);
  if (!quote) return UNAVAILABLE_METADATA;

  return {
    title: `Cotización ${quote.number}`,
    robots: { index: false, follow: false },
  };
}

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

export default async function QuotePublicPage({ params, searchParams }: QuotePublicPageProps) {
  const { token: rawToken } = await params;
  const query = await searchParams;
  const token = decodeURIComponent(rawToken);
  const autoPay = Array.isArray(query.pago) ? query.pago[0] : query.pago;

  let quote = null;
  try {
    quote = await getQuoteForAccessToken(token);
  } catch (error) {
    console.error("[smartpro:quotes:public] Error cargando cotización", error);
  }

  if (!quote) {
    return (
      <UnavailableState />
    );
  }

  let alreadySold = false;
  try {
    alreadySold = Boolean(await getSaleByQuoteId(quote.id));
  } catch {
    alreadySold = false;
  }

  const blockReason = getQuotePaymentBlockReason(quote, alreadySold);
  const taxPercent = Math.round((quote.items[0]?.taxRate ?? 0.19) * 100);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Link href="/" className="inline-flex items-center">
            <Image
              src="/images/logo/logo-smartpro-full.png"
              alt="SmartPro"
              width={210}
              height={52}
              className="h-12 w-auto"
              priority
            />
          </Link>
          <div className="text-left sm:text-right">
            <p className="text-sm font-semibold">{SMARTPRO_COMPANY.tagline}</p>
            <p className="mt-1 text-xs text-white/70">Ideas · Tecnología · Resultados</p>
          </div>
        </div>
        <div className="h-1 bg-gradient-to-r from-primary via-[#a42be2] to-magenta" />
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        <section className="rounded-[28px] border border-border bg-white p-5 shadow-[0_18px_46px_rgba(16,16,36,0.05)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-magenta">Cotización</p>
              <h1 className="mt-2 text-[clamp(1.8rem,1.1rem+2vw,2.6rem)] font-bold tracking-[-0.06em] text-navy">{quote.number}</h1>
              <p className="mt-2 text-sm text-muted">Propuesta comercial</p>
              <div className="mt-3 h-1 w-12 rounded-full bg-magenta" />
            </div>
            <div className="rounded-2xl bg-soft-background px-4 py-4 text-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Fecha de emisión</p>
              <p className="mt-1 font-semibold text-foreground">{formatDate(quote.createdAt)}</p>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Válida hasta</p>
              <p className="mt-1 font-semibold text-foreground">{formatDate(quote.validUntil)}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <InfoCard title="Emitida por">
              <p className="font-semibold text-foreground">{SMARTPRO_COMPANY.brandName}</p>
              <p>{SMARTPRO_COMPANY.legalName}</p>
              <p>
                {SMARTPRO_COMPANY.address}, {SMARTPRO_COMPANY.commune}
              </p>
              <p>{SMARTPRO_COMPANY.phone}</p>
              <p>{SMARTPRO_COMPANY.email}</p>
              <p>{SMARTPRO_COMPANY.website.replace(/^https?:\/\//, "")}</p>
            </InfoCard>
            <InfoCard title="Cliente">
              <p className="font-semibold text-foreground">{quote.clientCompany || quote.clientName}</p>
              {quote.clientName ? <p>{quote.clientName}</p> : null}
              {quote.clientRut ? <p>RUT {quote.clientRut}</p> : null}
              {quote.clientEmail ? <p className="break-all">{quote.clientEmail}</p> : null}
              {quote.clientPhone ? <p>{quote.clientPhone}</p> : null}
              {quote.clientAddress ? <p>{quote.clientAddress}</p> : null}
            </InfoCard>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-navy text-[11px] uppercase tracking-[0.16em] text-white">
                <tr>
                  <th className="px-4 py-3 font-medium">Servicio / plan</th>
                  <th className="px-4 py-3 font-medium text-right">Cant.</th>
                  <th className="px-4 py-3 font-medium text-right">Precio</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item) => (
                  <tr key={item.id} className="border-t border-border bg-white">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">{item.planName}</p>
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

          <div className="mt-5 ml-auto max-w-sm space-y-2 text-sm">
            <div className="flex items-center justify-between text-muted">
              <span>Subtotal</span>
              <span>{formatCurrency(quote.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-muted">
              <span>IVA ({taxPercent}%)</span>
              <span>{formatCurrency(quote.tax)}</span>
            </div>
            <div className="flex items-end justify-between border-t border-border pt-3">
              <span className="text-sm font-bold uppercase tracking-[0.08em] text-navy">Inversión total</span>
              <span className="text-2xl font-bold tracking-[-0.05em] text-magenta">{formatCurrency(quote.total)}</span>
            </div>
            <p className="text-right text-xs text-muted">IVA incluido</p>
          </div>

          <div className="mt-8">
            <QuotePaymentActions token={token} autoPay={autoPay} disabled={Boolean(blockReason)} disabledReason={blockReason} />
          </div>

          {quote.notes ? (
            <div className="mt-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Observaciones</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">{quote.notes}</p>
            </div>
          ) : null}

          <div id="datos-bancarios" className="mt-8 scroll-mt-8 rounded-2xl border border-border bg-slate-50/80 p-4 sm:p-5">
            <QuoteCommercialTerms quote={quote} />
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-navy py-6 text-center text-xs text-white/75">
        <p>
          {SMARTPRO_COMPANY.brandName} · {SMARTPRO_COMPANY.email} · {SMARTPRO_COMPANY.phone}
        </p>
        <p className="mt-1">{SMARTPRO_COMPANY.website.replace(/^https?:\/\//, "")}</p>
      </footer>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-soft-background px-4 py-4 text-sm leading-6 text-muted">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">{title}</p>
      <div className="mt-2 space-y-0.5">{children}</div>
    </div>
  );
}

function UnavailableState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-lg rounded-[28px] border border-border bg-white p-8 text-center shadow-[0_18px_46px_rgba(16,16,36,0.05)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">SmartPro</p>
        <h1 className="mt-3 text-2xl font-bold tracking-[-0.05em] text-foreground">Esta cotización no está disponible</h1>
        <p className="mt-3 text-sm text-muted">
          El enlace no es válido o la cotización ya no se puede consultar. Si necesitas ayuda, escríbenos a {SMARTPRO_COMPANY.email}.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-r from-primary to-magenta px-5 text-sm font-semibold text-white"
        >
          Ir a SmartPro
        </Link>
      </div>
    </main>
  );
}
