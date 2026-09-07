"use client";

import { useEffect, useState } from "react";

import { getExecutiveRoleLabel } from "@/lib/executives/types";

type ExecutiveInviteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onInvited?: () => void;
};

const emptyForm = {
  email: "",
  role: "EXECUTIVE" as "EXECUTIVE" | "ADMIN",
};

export function ExecutiveInviteModal({ isOpen, onClose, onInvited }: ExecutiveInviteModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

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
      const response = await fetch("/api/executives/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "No se pudo enviar la invitación.");
        setIsSubmitting(false);
        return;
      }

      setSuccess(data.message ?? "Invitación enviada correctamente.");
      setForm(emptyForm);
      onInvited?.();
    } catch {
      setError("No se pudo enviar la invitación. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-executive-title"
    >
      <button
        type="button"
        aria-label="Cerrar modal"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-border bg-white p-5 shadow-[0_18px_56px_rgba(16,16,36,0.14)] sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">Invitaciones</p>
            <h2 id="invite-executive-title" className="mt-2 text-2xl font-bold tracking-[-0.05em] text-foreground">
              Invitar ejecutivo
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Envía una invitación por correo para que complete su cuenta y acceda al Dashboard.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-lg text-muted-foreground transition hover:text-foreground"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">Correo electrónico</span>
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
            <span className="mb-2 block text-sm font-medium text-foreground">Rol</span>
            <select
              value={form.role}
              onChange={(event) => updateField("role", event.target.value)}
              className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition focus:border-primary"
            >
              <option value="EXECUTIVE">Ejecutivo</option>
              <option value="ADMIN">Administrador</option>
            </select>
            <p className="mt-2 text-xs text-muted-foreground">
              Rol asignado: {getExecutiveRoleLabel(form.role)}
            </p>
          </label>

          {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          {success && (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-border bg-white px-4 text-sm font-semibold text-foreground"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-gradient-to-r from-primary to-magenta px-6 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(109,40,217,0.2)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Enviando..." : "Enviar invitación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
