"use client";

import Link from "next/link";

import { motion } from "motion/react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { useCart } from "@/components/cart/CartProvider";
import CheckoutForm from "@/components/checkout/CheckoutForm";

export default function CheckoutPageClient() {
  const { items, subtotal, tax, total, isHydrated } = useCart();

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
        <div className="w-full max-w-md rounded-[2rem] border border-border bg-white p-8 text-center shadow-[0_22px_60px_rgba(16,16,36,0.04)]">
          <div className="mx-auto h-14 w-14 animate-pulse rounded-full bg-primary/10" />
          <p className="mt-5 text-sm font-medium text-muted">Preparando tu carrito...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-white/80 backdrop-blur-xl">
        <div className="section-container flex items-center justify-between gap-4 py-5">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary">
            <ArrowLeft size={16} />
            Volver al inicio
          </Link>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">SmartPro</p>
            <p className="text-sm font-semibold text-foreground">Checkout</p>
          </div>
        </div>
      </header>

      <main className="section-container flex-1 py-10 lg:py-16">
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-xl rounded-[2rem] border border-border bg-white p-8 text-center shadow-[0_22px_60px_rgba(16,16,36,0.04)]"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/8 text-primary">
              <CheckCircle2 size={28} />
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-[-0.04em] text-foreground">Tu carro está vacío</h1>
            <p className="mt-3 text-sm text-muted">Agrega un plan o servicio para continuar con la compra.</p>
            <Link href="/#servicios" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-primary to-magenta px-6 text-sm font-semibold text-white">
              Ver servicios
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Resumen de compra</p>
                <h1 className="mt-2 text-3xl font-bold tracking-[-0.05em] text-foreground sm:text-4xl">Finaliza tu contratación</h1>
              </div>
              <div className="rounded-full border border-primary/15 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary">
                {items.reduce((sum, item) => sum + item.quantity, 0)} productos
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.5fr_0.7fr]">
              <div className="space-y-5">
                <div className="rounded-[2rem] border border-border bg-white p-5 shadow-[0_18px_48px_rgba(16,16,36,0.04)] sm:p-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Productos</p>
                  <div className="mt-4 space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-soft-background p-4">
                        <div>
                          <p className="font-semibold text-foreground">{item.name}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-primary">{item.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">{item.quantity} x {item.unitPrice.toLocaleString("es-CL")}</p>
                          <p className="text-sm text-muted">Total: {(item.unitPrice * item.quantity).toLocaleString("es-CL")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <CheckoutForm />
              </div>

              <aside className="rounded-[2rem] border border-border bg-white p-5 shadow-[0_18px_48px_rgba(16,16,36,0.04)] sm:p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Totales</p>
                <div className="mt-5 space-y-3 text-sm text-foreground">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span>{subtotal.toLocaleString("es-CL", { style: "currency", currency: "CLP" })}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>IVA</span>
                    <span>{tax.toLocaleString("es-CL", { style: "currency", currency: "CLP" })}</span>
                  </div>
                  <div className="mt-4 border-t border-border pt-4 text-base font-bold">
                    <div className="flex items-center justify-between">
                      <span>Total</span>
                      <span>{total.toLocaleString("es-CL", { style: "currency", currency: "CLP" })}</span>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
