"use client";

import { useMemo, useState } from "react";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";

import { useCart } from "@/components/cart/CartProvider";
import { formatCurrency } from "@/lib/orders/service";
import { isAllowedWebpayRedirectUrl } from "@/lib/webpay/redirect";

type CheckoutState = {
  name: string;
  email: string;
  phone: string;
  company: string;
};

type PaymentMethodOption = "mercadopago" | "webpay";

const initialState: CheckoutState = {
  name: "",
  email: "",
  phone: "",
  company: "",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function redirectToWebpay(url: string, token: string) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;
  form.acceptCharset = "UTF-8";

  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "token_ws";
  input.value = token;
  form.appendChild(input);

  document.body.appendChild(form);
  form.submit();
}

export default function CheckoutForm() {
  const { items, subtotal, tax, total } = useCart();
  const [form, setForm] = useState<CheckoutState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutState, string>>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodOption>("mercadopago");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const orderSummary = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        subtotal: item.unitPrice * item.quantity,
      })),
    [items],
  );

  const validate = () => {
    const nextErrors: Partial<Record<keyof CheckoutState, string>> = {};

    if (!form.name.trim()) nextErrors.name = "Ingresa tu nombre completo.";
    if (!form.email.trim()) nextErrors.email = "Ingresa tu correo.";
    else if (!emailPattern.test(form.email)) nextErrors.email = "Correo no válido.";
    if (!form.phone.trim()) nextErrors.phone = "Ingresa tu teléfono o WhatsApp.";
    else if (form.phone.replace(/\D/g, "").length < 8) nextErrors.phone = "Teléfono no válido.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const checkoutPayload = () => ({
    customer: {
      name: form.name,
      email: form.email,
      phone: form.phone,
      company: form.company,
    },
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      priceDisplay: item.priceDisplay,
      taxRate: item.taxRate,
    })),
  });

  const handleMercadoPago = async () => {
    const response = await fetch("/api/mercadopago/preference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(checkoutPayload()),
    });

    const payload = (await response.json()) as {
      error?: string;
      order?: { id?: string };
      mercadopago?: { checkoutUrl?: string };
    };

    if (!response.ok || !payload.order?.id || !payload.mercadopago?.checkoutUrl) {
      throw new Error(payload.error ?? "No se pudo iniciar el pago con Mercado Pago.");
    }

    setSuccess(`Orden ${payload.order.id} creada. Redirigiendo a Mercado Pago...`);
    window.location.href = payload.mercadopago.checkoutUrl;
  };

  const handleWebpay = async () => {
    const response = await fetch("/api/webpay/transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(checkoutPayload()),
    });

    const payload = (await response.json()) as {
      error?: string;
      order?: { id?: string };
      webpay?: { token?: string; url?: string };
    };

    if (!response.ok || !payload.order?.id || !payload.webpay?.token || !payload.webpay?.url) {
      throw new Error(payload.error ?? "No se pudo iniciar el pago con Webpay.");
    }

    if (!isAllowedWebpayRedirectUrl(payload.webpay.url)) {
      throw new Error("Webpay no devolvió una URL de redirección válida.");
    }

    setSuccess(`Orden ${payload.order.id} creada. Redirigiendo a Webpay...`);
    redirectToWebpay(payload.webpay.url, payload.webpay.token);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!items.length) {
      setSubmitError("Debes agregar al menos un producto antes de continuar.");
      return;
    }

    setProcessing(true);
    setSubmitError(null);
    setSuccess(null);

    try {
      if (paymentMethod === "webpay") {
        await handleWebpay();
        return;
      }

      await handleMercadoPago();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo iniciar el pago.");
      setProcessing(false);
    }
  };

  const payLabel = processing
    ? "Procesando orden..."
    : paymentMethod === "webpay"
      ? "Pagar con Webpay"
      : "Pagar con Mercado Pago";

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
      <div className="rounded-[2rem] border border-border bg-white p-5 shadow-[0_18px_48px_rgba(16,16,36,0.04)] sm:p-7">
        <div className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Checkout</p>
          <h1 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-foreground sm:text-3xl">Información del cliente</h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2 block">
            <span className="mb-2 block text-sm font-medium text-foreground">Nombre completo *</span>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition-colors focus:border-primary"
              placeholder="José Pérez"
            />
            {errors.name && <span className="mt-1 block text-xs text-red-500">{errors.name}</span>}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">Correo electrónico *</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition-colors focus:border-primary"
              placeholder="correo@ejemplo.cl"
            />
            {errors.email && <span className="mt-1 block text-xs text-red-500">{errors.email}</span>}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">Teléfono / WhatsApp *</span>
            <input
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition-colors focus:border-primary"
              placeholder="+56 9 1234 5678"
            />
            {errors.phone && <span className="mt-1 block text-xs text-red-500">{errors.phone}</span>}
          </label>

          <label className="sm:col-span-2 block">
            <span className="mb-2 block text-sm font-medium text-foreground">Empresa (opcional)</span>
            <input
              value={form.company}
              onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
              className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition-colors focus:border-primary"
              placeholder="SmartPro SpA"
            />
          </label>
        </div>

        <div className="mt-6 rounded-2xl border border-primary/10 bg-primary/5 p-4">
          <p className="text-sm font-semibold text-foreground">Productos seleccionados</p>
          <div className="mt-3 space-y-3">
            {orderSummary.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-foreground/80">{item.name} x{item.quantity}</span>
                <span className="font-semibold text-foreground">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>
        </div>

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold text-foreground">Método de pago</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                paymentMethod === "mercadopago" ? "border-primary bg-primary/5" : "border-border bg-soft-background"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="mercadopago"
                checked={paymentMethod === "mercadopago"}
                onChange={() => setPaymentMethod("mercadopago")}
                className="accent-primary"
              />
              <Image src="/images/logo/logo-mercado-pago.png" alt="" width={92} height={28} className="h-7 w-auto object-contain" />
              <span className="text-sm font-medium text-foreground">Mercado Pago</span>
            </label>
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                paymentMethod === "webpay" ? "border-primary bg-primary/5" : "border-border bg-soft-background"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="webpay"
                checked={paymentMethod === "webpay"}
                onChange={() => setPaymentMethod("webpay")}
                className="accent-primary"
              />
              <Image src="/images/logo/webpay-plus.png" alt="" width={92} height={28} className="h-7 w-auto object-contain" />
              <span className="text-sm font-medium text-foreground">Webpay</span>
            </label>
          </div>
        </fieldset>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={processing || !items.length}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-gradient-to-r from-primary to-magenta px-6 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(109,40,217,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {payLabel}
          </button>
        </div>

        <AnimatePresence>
          {submitError && (
            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {submitError}
            </motion.p>
          )}

          {success && (
            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <aside className="rounded-[2rem] border border-border bg-soft-background p-5 shadow-[0_18px_48px_rgba(16,16,36,0.04)] sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Resumen</p>
        <div className="mt-5 space-y-3 text-sm text-foreground">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>IVA</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className="mt-4 border-t border-border pt-4 text-base font-bold">
            <div className="flex items-center justify-between">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
