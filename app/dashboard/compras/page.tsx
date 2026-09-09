import { Suspense } from "react";
import Link from "next/link";

import { DashboardPageHeader } from "@/components/admin/DashboardPageHeader";
import { DashboardDataError } from "@/components/admin/DashboardDataError";
import { PurchasesPageSkeleton } from "@/components/admin/dashboard-skeletons";
import { requireAdminSession } from "@/lib/auth";
import { listOrders } from "@/lib/orders/repository";

export const dynamic = "force-dynamic";

function PurchasesHeader() {
  return (
    <DashboardPageHeader
      icon="compras"
      eyebrow="Ventas"
      title="Últimas ventas"
      description="Pagos registrados y seguimiento de órdenes de SmartPro."
    />
  );
}

export default function PurchasesPage() {
  return (
    <Suspense fallback={<PurchasesPageSkeleton />}>
      <PurchasesPageContent />
    </Suspense>
  );
}

async function PurchasesPageContent() {
  await requireAdminSession();

  let orders: Awaited<ReturnType<typeof listOrders>> = [];
  let loadError = false;

  try {
    orders = await listOrders();
  } catch (error) {
    console.error("[smartpro:dashboard:compras] Error de conexión a la base de datos", error);
    loadError = true;
  }

  if (loadError) {
    return (
      <DashboardDataError
        icon="compras"
        eyebrow="Ventas"
        title="Últimas ventas"
      />
    );
  }

  if (!orders.length) {
    return (
      <div className="space-y-6">
        <PurchasesHeader />
        <div className="rounded-[26px] border border-dashed border-border bg-white p-8 text-center shadow-[0_18px_46px_rgba(16,16,36,0.04)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">Compras</p>
          <h1 className="mt-2 text-2xl font-bold tracking-[-0.05em] text-foreground">No hay compras aún</h1>
          <p className="mt-3 text-sm text-muted">Cuando Mercado Pago confirme un pago, aparecerá aquí la venta registrada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PurchasesHeader />

      <div className="overflow-hidden rounded-[24px] border border-border bg-white shadow-[0_18px_46px_rgba(16,16,36,0.04)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-foreground">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.18em] text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Orden</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const planName = order.items[0]?.name ?? "Servicio";

                return (
                  <tr key={order.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium text-foreground">#{order.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{order.customer.name}</div>
                      <div className="text-xs text-muted">{order.customer.email}</div>
                    </td>
                    <td className="px-4 py-3">{planName}</td>
                    <td className="px-4 py-3 font-semibold">${order.total.toLocaleString("es-CL")}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        {order.paymentStatus === "paid" ? "Pagada" : order.orderStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/compras/${order.id}`} className="inline-flex min-h-10 items-center justify-center rounded-full border border-border px-3 text-xs font-semibold text-foreground">
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
