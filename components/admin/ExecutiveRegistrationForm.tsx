"use client";

import { useState } from "react";
import type { ExecutiveRecord } from "@/lib/executives/types";

const emptyForm = {
  firstName: "",
  lastName: "",
  rut: "",
  email: "",
  phone: "",
  password: "",
  role: "EXECUTIVE" as "EXECUTIVE" | "ADMIN",
};

type ExecutiveRegistrationFormProps = {
  onCreated?: (executive: ExecutiveRecord) => void;
};

export function ExecutiveRegistrationForm({ onCreated }: ExecutiveRegistrationFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof typeof emptyForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/executives", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        executive?: ExecutiveRecord;
      };

      if (!response.ok) {
        setError(data.error ?? "No se pudo registrar el ejecutivo.");
        setIsSubmitting(false);
        return;
      }

      setSuccess("Ejecutivo registrado correctamente.");
      setForm(emptyForm);

      if (data.executive) {
        onCreated?.(data.executive);
      }
    } catch {
      setError("No se pudo registrar el ejecutivo. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[24px] border border-border bg-white p-5 shadow-[0_18px_46px_rgba(16,16,36,0.04)]">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">Ejecutivos</p>
        <h2 className="mt-2 text-2xl font-bold tracking-[-0.05em] text-foreground">Registrar ejecutivo</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-foreground">Nombre</span>
          <input
            value={form.firstName}
            onChange={(event) => updateField("firstName", event.target.value)}
            className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition focus:border-primary"
            placeholder="Nombre"
            autoComplete="given-name"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-foreground">Apellido</span>
          <input
            value={form.lastName}
            onChange={(event) => updateField("lastName", event.target.value)}
            className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition focus:border-primary"
            placeholder="Apellido"
            autoComplete="family-name"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-foreground">RUT</span>
          <input
            value={form.rut}
            onChange={(event) => updateField("rut", event.target.value)}
            className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition focus:border-primary"
            placeholder="12.345.678-9"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-foreground">Correo</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition focus:border-primary"
            placeholder="ejecutivo@smartpro.cl"
            autoComplete="email"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-foreground">Teléfono</span>
          <input
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition focus:border-primary"
            placeholder="+56 9 1234 5678"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-foreground">Rol</span>
          <select
            value={form.role}
            onChange={(event) => updateField("role", event.target.value)}
            className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition focus:border-primary"
          >
            <option value="EXECUTIVE">Ejecutivo</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </label>

        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-medium text-foreground">Contraseña</span>
          <input
            type="password"
            value={form.password}
            onChange={(event) => updateField("password", event.target.value)}
            className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition focus:border-primary"
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </label>
      </div>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {success && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-primary to-magenta px-6 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(109,40,217,0.2)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Guardando..." : "Registrar ejecutivo"}
      </button>
    </form>
  );
}
