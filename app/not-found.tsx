import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Página no encontrada",
  description: "La página que buscas no existe o fue movida.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-xl rounded-[2rem] border border-border bg-white p-8 text-center shadow-[0_22px_60px_rgba(16,16,36,0.04)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">SmartPro</p>
        <h1 className="mt-4 text-4xl font-bold tracking-[-0.05em] text-foreground">404</h1>
        <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-foreground">Página no encontrada</h2>
        <p className="mt-3 text-sm text-muted">
          La URL que intentas abrir no existe o fue movida. Puedes volver al inicio o escribirnos para ayudarte.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-primary to-magenta px-6 text-sm font-semibold text-white">
            Volver al inicio
          </Link>
          <Link href="/#contacto" className="inline-flex min-h-12 items-center justify-center rounded-full border border-border px-6 text-sm font-semibold text-foreground">
            Contactar
          </Link>
        </div>
      </div>
    </main>
  );
}
