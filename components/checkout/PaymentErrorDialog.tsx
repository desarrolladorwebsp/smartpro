"use client";

import { useEffect } from "react";

import { X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";

import { getCheckoutPaymentWhatsAppUrl } from "@/lib/contact/whatsapp";
import {
  PUBLIC_PAYMENT_ERROR_MESSAGE,
  PUBLIC_PAYMENT_ERROR_TITLE,
} from "@/lib/payments/public-messages";

type PaymentErrorDialogProps = {
  open: boolean;
  message?: string;
  debug?: string;
  orderId?: string | null;
  onClose: () => void;
};

export default function PaymentErrorDialog({
  open,
  message = PUBLIC_PAYMENT_ERROR_MESSAGE,
  debug,
  orderId,
  onClose,
}: PaymentErrorDialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const whatsappHref = getCheckoutPaymentWhatsAppUrl(orderId);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-navy/40 p-4 backdrop-blur-sm"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Cerrar mensaje"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-error-title"
        className="relative w-full max-w-md rounded-[2rem] border border-border bg-white p-6 shadow-[0_22px_60px_rgba(16,16,36,0.16)] sm:p-7"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted transition hover:text-foreground"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>

        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">SmartPro</p>
        <h2 id="payment-error-title" className="mt-2 pr-10 text-2xl font-bold tracking-[-0.04em] text-foreground">
          {PUBLIC_PAYMENT_ERROR_TITLE}
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted">{message}</p>

        {debug ? (
          <p className="mt-3 rounded-2xl border border-border bg-soft-background px-4 py-3 text-xs text-muted">
            <span className="font-semibold text-foreground">Detalle técnico (desarrollo): </span>
            {debug}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(37,211,102,0.28)] transition hover:brightness-105"
          >
            <FaWhatsapp size={18} aria-hidden="true" />
            Contactar por WhatsApp
          </a>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-white px-5 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:text-primary"
          >
            Intentar otra vez
          </button>
        </div>
      </div>
    </div>
  );
}
