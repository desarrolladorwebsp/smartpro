import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DepositPaymentButton } from "@/components/checkout/DepositPaymentButton";
import { formatCurrency } from "@/lib/orders/service";
import { getPublicPaymentRequest } from "@/lib/sales/payment-requests";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Abono SmartPro", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function DepositPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const deposit = await getPublicPaymentRequest(token);
  if (!deposit) notFound();

  return <main className="grid min-h-screen place-items-center bg-soft-background px-4 py-12 text-foreground">
    <section className="w-full max-w-md rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-semibold text-primary">SmartPro</p>
      <h1 className="mt-2 text-2xl font-bold">{deposit.status === "PAID" ? "Abono pagado" : "Abono de venta"}</h1>
      <p className="mt-1 text-sm text-muted">Venta {deposit.saleNumber}</p>
      <p className="mt-4 text-3xl font-bold tabular-nums">{formatCurrency(deposit.amount)}</p>
      {deposit.status === "PAID" ? <p className="mt-4 text-emerald-800">El pago está confirmado.</p>
        : !deposit.payable ? <p className="mt-4 text-sm text-muted">Este enlace ya no está disponible para pago. Contacta a SmartPro si necesitas un enlace actualizado.</p>
        : <DepositPaymentButton token={token} processing={deposit.status === "PROCESSING"} />}
    </section>
  </main>;
}
