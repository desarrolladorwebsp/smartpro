"use client";

import { useCallback, useRef, useState } from "react";
import { X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";

import PaymentErrorDialog from "@/components/checkout/PaymentErrorDialog";
import { getCheckoutPaymentWhatsAppUrl } from "@/lib/contact/whatsapp";
import {
  PAYMENT_REQUEST_TIMEOUT_MS,
  PUBLIC_PAYMENT_STATUS_COPY,
  readResponseJson,
  resolvePublicPaymentFailure,
} from "@/lib/payments/public-messages";
import { isAllowedWebpayRedirectUrl } from "@/lib/webpay/redirect";
import { redirectToWebpay } from "@/lib/webpay/client-redirect";

type QuoteOnlinePaymentMethod = "webpay" | "mercadopago";

type QuotePaymentActionsProps = {
  token: string;
  autoPay?: string;
  disabled?: boolean;
  disabledReason?: string | null;
};

type PaymentErrorState = {
  message: string;
  debug?: string;
};

export function QuotePaymentActions({ token, autoPay, disabled, disabledReason }: QuotePaymentActionsProps) {
  const [processing, setProcessing] = useState<QuoteOnlinePaymentMethod | null>(null);
  const [paymentError, setPaymentError] = useState<PaymentErrorState | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const inFlight = useRef(false);
  const preferred = autoPay === "webpay" || autoPay === "mercadopago" ? autoPay : null;
  const whatsappHref = getCheckoutPaymentWhatsAppUrl();

  const startPayment = useCallback(
    async (method: QuoteOnlinePaymentMethod) => {
      if (disabled || inFlight.current) return;
      inFlight.current = true;
      setProcessing(method);
      setPaymentError(null);
      setErrorDialogOpen(false);

      const fail = (caught: unknown, status?: number, apiError?: string | null) => {
        const resolved = resolvePublicPaymentFailure({ status, apiError, caught });
        setPaymentError(resolved);
        setErrorDialogOpen(true);
        inFlight.current = false;
        setProcessing(null);
      };

      try {
        const response = await fetch("/api/quotes/pay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, method }),
          signal: AbortSignal.timeout(PAYMENT_REQUEST_TIMEOUT_MS),
        });
        const payload = await readResponseJson(response);
        const apiError = typeof payload.error === "string" ? payload.error : null;
        const webpay = payload.webpay as { token?: string; url?: string } | undefined;
        const mercadopago = payload.mercadopago as { checkoutUrl?: string } | undefined;

        if (!response.ok) {
          fail(null, response.status, apiError);
          return;
        }

        if (method === "webpay") {
          if (!webpay?.token || !webpay.url || !isAllowedWebpayRedirectUrl(webpay.url)) {
            fail(new Error("Webpay no devolvió una URL de redirección válida."), response.status, apiError);
            return;
          }
          redirectToWebpay(webpay.url, webpay.token);
          return;
        }

        if (!mercadopago?.checkoutUrl) {
          fail(new Error("Mercado Pago no devolvió una URL de pago."), response.status, apiError);
          return;
        }

        window.location.href = mercadopago.checkoutUrl;
      } catch (caught) {
        fail(caught);
      }
    },
    [disabled, token],
  );

  return (
    <div className="rounded-[24px] border border-primary/10 bg-gradient-to-br from-[#F8F4FF] to-[#FFF5FB] p-5 sm:p-6 print:hidden">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Pagos online</p>
      <h2 className="mt-2 text-xl font-bold tracking-[-0.05em] text-foreground">Elige cómo pagar tu cotización</h2>
      <p className="mt-2 text-sm text-muted">Paga fácil, seguro y 100% online. El monto se toma de esta cotización y no se puede modificar.</p>

      {preferred && !disabled ? (
        <p className="mt-3 text-sm font-medium text-primary">
          {preferred === "webpay" ? "Continúa con Webpay para completar el pago." : "Continúa con Mercado Pago para completar el pago."}
        </p>
      ) : null}

      {disabledReason ? (
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="status">
          {disabledReason}
        </p>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => void startPayment("webpay")}
          disabled={disabled || Boolean(processing)}
          className={`inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(236,22,140,0.24)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 ${
            preferred === "mercadopago" ? "bg-magenta/80" : "bg-magenta"
          }`}
        >
          {processing === "webpay" ? PUBLIC_PAYMENT_STATUS_COPY.redirecting : "Pagar con Webpay"}
        </button>
        <button
          type="button"
          onClick={() => void startPayment("mercadopago")}
          disabled={disabled || Boolean(processing)}
          className={`inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(109,40,217,0.24)] transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 ${
            preferred === "webpay" ? "bg-primary/80" : "bg-primary"
          }`}
        >
          {processing === "mercadopago" ? PUBLIC_PAYMENT_STATUS_COPY.redirecting : "Pagar con Mercado Pago"}
        </button>
      </div>

      <a
        href="#datos-bancarios"
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-border bg-white px-5 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:text-primary sm:w-auto"
      >
        Ver datos bancarios
      </a>

      <p className="mt-3 text-xs text-muted">Aceptamos tarjetas de débito, crédito y prepago.</p>

      {paymentError && !errorDialogOpen ? (
        <div className="mt-4 rounded-2xl border border-primary/15 bg-white px-4 py-4" role="alert">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{PUBLIC_PAYMENT_STATUS_COPY.failed}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{paymentError.message}</p>
              {paymentError.debug ? (
                <p className="mt-2 text-xs text-muted">
                  <span className="font-semibold text-foreground">Detalle técnico (desarrollo): </span>
                  {paymentError.debug}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setPaymentError(null)}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted transition hover:text-foreground"
              aria-label="Cerrar mensaje"
            >
              <X size={14} />
            </button>
          </div>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 text-sm font-semibold text-white"
          >
            <FaWhatsapp size={16} aria-hidden="true" />
            Contactar por WhatsApp
          </a>
        </div>
      ) : null}

      <PaymentErrorDialog
        open={errorDialogOpen}
        message={paymentError?.message}
        debug={paymentError?.debug}
        onClose={() => setErrorDialogOpen(false)}
      />
    </div>
  );
}
