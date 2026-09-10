"use client";

import { useRouter } from "next/navigation";

import { DashboardPageHeader } from "@/components/admin/DashboardPageHeader";

type DashboardDataErrorProps = {
  icon?: "dashboard" | "clientes" | "cotizaciones" | "servicios" | "compras" | "ventas" | "ejecutivos";
  eyebrow: string;
  title: string;
  message?: string;
};

export function DashboardDataError({
  icon,
  eyebrow,
  title,
  message = "No se pudo conectar a la base de datos.",
}: DashboardDataErrorProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <DashboardPageHeader icon={icon} eyebrow={eyebrow} title={title} />
      <div className="rounded-[24px] border border-dashed border-border bg-white p-8 text-center shadow-[0_12px_30px_rgba(16,16,36,0.04)]">
        <p className="text-sm font-semibold text-foreground">{message}</p>
        <p className="mt-2 text-sm text-muted">
          Intenta nuevamente. Si el problema persiste, contacta al equipo técnico.
        </p>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-r from-primary to-magenta px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(109,40,217,0.22)] transition hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
