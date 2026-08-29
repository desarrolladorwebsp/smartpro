import Link from "next/link";

import { requireAdminSession } from "@/lib/auth";
import { getOrderRecord } from "@/lib/orders/repository";

export default async function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();

  const { id } = await params;
  const order = await getOrderRecord(id);

  if (!order) {
    return (
      <div className="rounded-[26px] border border-dashed border-border bg-white p-8 text-center shadow-[0_18px_46px_rgba(16,16,36,0.04)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">Compra</p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-0.05em] text-foreground">No se encontró la orden</h1>
        <Link href="/dashboard/compras" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-r from-primary to-magenta px-5 text-sm font-semibold text-white">
          Volver a compras
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">Compra</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.05em] text-foreground">#{order.id}</h1>
        </div>
        <Link href="/dashboard/compras" className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-white px-5 text-sm font-semibold text-foreground">
          Volver
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-[26px] border border-border bg-white p-5 shadow-[0_18px_46px_rgba(16,16,36,0.04)]">
          <h2 className="text-lg font-bold tracking-[-0.04em] text-foreground">Detalle de la compra</h2>

          <div className="mt-5 space-y-4 text-sm text-foreground">
            {order.items.map((item) => {
              const itemTotal = item.unitPrice * item.quantity;

              return (
                <div key={`${order.id}-${item.name}`} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-slate-50 p-3">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-muted">Cantidad: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">${itemTotal.toLocaleString("es-CL")}</p>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="space-y-6 rounded-[26px] border border-border bg-white p-5 shadow-[0_18px_46px_rgba(16,16,36,0.04)]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">Cliente</p>
            <h3 className="mt-2 text-xl font-bold tracking-[-0.04em] text-foreground">{order.customer.name}</h3>
            <p className="mt-1 text-sm text-muted">{order.customer.email}</p>
            <p className="mt-1 text-sm text-muted">{order.customer.phone}</p>
          </div>

          <div className="rounded-2xl border border-border bg-slate-50 p-4">
            <div className="flex items-center justify-between text-sm text-muted">
              <span>Subtotal</span>
              <span>${order.subtotal.toLocaleString("es-CL")}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-muted">
              <span>Impuestos</span>
              <span>${order.tax.toLocaleString("es-CL")}</span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-base font-bold text-foreground">
              <span>Total</span>
              <span>${order.total.toLocaleString("es-CL")}</span>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">Pago</p>
            <p className="mt-2 text-base font-semibold text-foreground">{order.paymentStatus === "paid" ? "Aprobado" : order.paymentStatus}</p>
            <p className="text-sm text-muted">Método: {order.paymentMethod}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
