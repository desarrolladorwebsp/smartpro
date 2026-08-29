"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function CheckoutResultClient() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "failed";
  const orderId = searchParams.get("orderId");

  const mapped = {
    approved: {
      title: "Pago confirmado",
      message: "Tu compra quedó registrada correctamente y ya está lista para ser atendida.",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
      action: "Volver al inicio",
      href: "/",
    },
    cancelled: {
      title: "Pago cancelado",
      message: "La transacción fue cancelada antes de completarse.",
      tone: "border-amber-200 bg-amber-50 text-amber-700",
      action: "Intentar otra vez",
      href: "/checkout",
    },
    failed: {
      title: "Pago no completado",
      message: "La transacción no pudo confirmarse. Puedes intentar nuevamente desde el checkout.",
      tone: "border-red-200 bg-red-50 text-red-600",
      action: "Reintentar compra",
      href: "/checkout",
    },
  } as const;

  const view = mapped[status as keyof typeof mapped] ?? mapped.failed;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-xl rounded-[2rem] border border-border bg-white p-8 text-center shadow-[0_22px_60px_rgba(16,16,36,0.04)]">
        <div className={`mx-auto mb-5 inline-flex rounded-full border px-4 py-2 text-sm font-semibold ${view.tone}`}>
          {view.title}
        </div>
        <h1 className="text-3xl font-bold tracking-[-0.05em] text-foreground">{view.title}</h1>
        <p className="mt-4 text-sm text-muted">{view.message}</p>
        {orderId && (
          <p className="mt-3 text-sm font-medium text-foreground">Orden: #{orderId}</p>
        )}
        <Link href={view.href} className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-primary to-magenta px-6 text-sm font-semibold text-white">
          {view.action}
        </Link>
      </div>
    </div>
  );
}
