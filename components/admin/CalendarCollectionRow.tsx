import { Wallet } from "lucide-react";
import Link from "next/link";

import { formatCurrency } from "@/lib/orders/service";
import type { CalendarCollectionDue } from "@/lib/sales/collections";

const collectionStatuses = {
  PAID: { label: "Pagado", accent: "bg-emerald-100 text-emerald-900" },
  UPCOMING: { label: "Pendiente", accent: "bg-teal-100 text-teal-900" },
  DUE: { label: "Vence hoy", accent: "bg-amber-100 text-amber-900" },
  OVERDUE: { label: "Vencido", accent: "bg-rose-100 text-rose-900" },
} as const;
const dueDate = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeZone: "UTC" });

export function CalendarCollectionRow({ due, showExecutive }: { due: CalendarCollectionDue; showExecutive: boolean }) {
  const status = collectionStatuses[due.status];
  const salePath = `/dashboard/ventas/${encodeURIComponent(due.saleId)}`;

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border bg-white px-3 py-2.5 text-sm">
      <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${status.accent}`}>
        <Wallet size={16} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <Link href={`${salePath}?origen=calendario`} prefetch={false}
            className="min-w-0 break-words font-semibold hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary">
            {due.clientName}
          </Link>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${status.accent}`}>{status.label}</span>
        </div>
        <p className="mt-0.5 break-words text-xs text-muted">
          {due.saleNumber} · {dueDate.format(new Date(`${due.dueOn}T00:00:00Z`))}
          {showExecutive && ` · ${due.executiveName ?? "Sin asignar"}`}
        </p>
      </div>
      <div className="flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-1 pl-11 sm:w-auto sm:justify-end sm:pl-0">
        <p className="font-semibold tabular-nums">{formatCurrency(due.remaining)} <span className="text-xs font-normal text-muted">por cobrar</span></p>
        <Link href={`${salePath}?abono=1&origen=calendario`} prefetch={false}
          className="inline-flex min-h-9 shrink-0 items-center rounded-lg border border-teal-200 bg-teal-50 px-2.5 text-xs font-semibold text-teal-900 hover:bg-teal-100 focus-visible:outline-2 focus-visible:outline-teal-700">
          Registrar abono
        </Link>
      </div>
    </li>
  );
}
