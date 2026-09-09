"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset?: () => void;
}) {
  useEffect(() => {
    console.error("[smartpro:dashboard] Error inesperado de ruta", error);
  }, [error]);

  function handleRetry() {
    (retry ?? reset)?.();
  }

  return (
    <div className="rounded-[24px] border border-dashed border-border bg-white p-8 text-center shadow-[0_12px_30px_rgba(16,16,36,0.04)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Dashboard</p>
      <h2 className="mt-2 text-2xl font-bold tracking-[-0.05em] text-foreground">No se pudo cargar esta vista</h2>
      <p className="mt-3 text-sm text-muted">
        Ocurrió un problema al obtener la información. Puedes reintentar sin salir del panel.
      </p>
      <button
        type="button"
        onClick={handleRetry}
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-r from-primary to-magenta px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(109,40,217,0.22)] transition hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        Reintentar
      </button>
    </div>
  );
}
