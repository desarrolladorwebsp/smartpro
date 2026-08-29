"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const email = form.email.trim();
    const password = form.password;

    if (!email || !password) {
      setError("Ingresa email y contraseña.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string; redirectTo?: string };

      if (!response.ok) {
        setError(data.error ?? "Credenciales inválidas.");
        setIsSubmitting(false);
        return;
      }

      router.push(data.redirectTo ?? "/dashboard");
      router.refresh();
    } catch {
      setError("No se pudo iniciar sesión. Inténtalo nuevamente.");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(109,40,217,0.12),_transparent_23%),_linear-gradient(180deg,_#f7f7fb_0%,_#eef0fb_100%)] p-5">
      <div className="w-full max-w-md rounded-[28px] border border-border bg-white p-6 shadow-[0_18px_48px_rgba(16,16,36,0.08)] sm:p-8">
        <div className="mb-6 text-center">
          <div className="flex justify-center">
            <Image
              src="/images/logo/logo-smartpro-01.png"
              alt="Smart Pro"
              width={240}
              height={58}
              priority
              className="h-auto w-[180px] sm:w-[220px]"
            />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-[-0.04em] text-foreground">Iniciar sesión</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition focus:border-primary"
              placeholder="comercial@smartpro.cl"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">Contraseña</span>
            <input
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition focus:border-primary"
              placeholder="••••••••"
            />
          </label>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-primary to-magenta px-6 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(109,40,217,0.2)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </main>
  );
}
