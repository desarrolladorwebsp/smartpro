"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FaWhatsapp } from "react-icons/fa6";

import { getCheckoutPaymentWhatsAppUrl } from "@/lib/contact/whatsapp";
import {
  PUBLIC_PAYMENT_ERROR_MESSAGE,
  PUBLIC_PAYMENT_STATUS_COPY,
} from "@/lib/payments/public-messages";

export default function CheckoutResultClient() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "failed";
  const orderId = searchParams.get("orderId");
  const whatsappHref = getCheckoutPaymentWhatsAppUrl(orderId);

  const mapped = {
    approved: {
      title: PUBLIC_PAYMENT_STATUS_COPY.confirmed,
      message: "Tu compra quedó registrada correctamente y ya está lista para ser atendida.",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
      action: "Volver al inicio",
      href: "/",
      showWhatsApp: false,
    },
    pending: {
      title: "Pago pendiente",
      message: "El pago todavía está en proceso. Te confirmaremos cuando se acredite.",
      tone: "border-sky-200 bg-sky-50 text-sky-700",
      action: "Volver al inicio",
      href: "/",
      showWhatsApp: false,
    },
    cancelled: {
      title: "Pago cancelado",
      message: "La transacción fue cancelada antes de completarse. Puedes intentarlo otra vez o escribirnos por WhatsApp.",
      tone: "border-primary/15 bg-primary/5 text-primary",
      action: "Intentar otra vez",
      href: "/checkout",
      showWhatsApp: true,
    },
    failed: {
      title: PUBLIC_PAYMENT_STATUS_COPY.failed,
      message: PUBLIC_PAYMENT_ERROR_MESSAGE,
      tone: "border-primary/15 bg-primary/5 text-primary",
      action: "Intentar otra vez",
      href: "/checkout",
      showWhatsApp: true,
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
        <p className="mt-4 text-sm leading-6 text-muted">{view.message}</p>
        {orderId && (
          <p className="mt-3 text-sm font-medium text-foreground">Orden: #{orderId}</p>
        )}
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {view.showWhatsApp ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(37,211,102,0.28)]"
            >
              <FaWhatsapp size={18} aria-hidden="true" />
              Contactar por WhatsApp
            </a>
          ) : null}
          <Link
            href={view.href}
            className={`inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-semibold ${
              view.showWhatsApp
                ? "border border-border bg-white text-foreground"
                : "bg-gradient-to-r from-primary to-magenta text-white"
            }`}
          >
            {view.action}
          </Link>
        </div>
      </div>
    </div>
  );
}
