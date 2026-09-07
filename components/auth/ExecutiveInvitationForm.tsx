"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getExecutiveRoleLabel, type ExecutiveRole } from "@/lib/executives/types";

const inputClassName =
  "w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition focus:border-primary";

const emptyForm = {
  firstName: "",
  lastName: "",
  rut: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

type InvitationPreview = {
  email: string;
  role: ExecutiveRole;
  expiresAt: string;
};

export function ExecutiveInvitationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [invitation, setInvitation] = useState<InvitationPreview | null>(null);
  const [loadError, setLoadError] = useState(token ? "" : "El enlace de invitación no es válido.");
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    async function loadInvitation() {
      setIsLoading(true);
      setLoadError("");

      try {
        const response = await fetch(`/api/invitations/executive?token=${encodeURIComponent(token)}`, {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
          invitation?: InvitationPreview;
        };

        if (cancelled) {
          return;
        }

        if (!response.ok || !data.invitation) {
          setLoadError(data.error ?? "La invitación no es válida, expiró o ya fue utilizada.");
          setInvitation(null);
          return;
        }

        setInvitation(data.invitation);
      } catch {
        if (!cancelled) {
          setLoadError("No se pudo validar la invitación. Inténtalo de nuevo.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadInvitation();

    return () => {
      cancelled = true;
    };
  }, [token]);

  function updateField(field: keyof typeof emptyForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!token) {
      setError("El enlace de invitación no es válido.");
      return;
    }

    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/invitations/executive/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          ...form,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string };

      if (!response.ok) {
        setError(data.error ?? "No se pudo completar la invitación.");
        setIsSubmitting(false);
        return;
      }

      setSuccess(data.message ?? "Cuenta creada correctamente.");
      setForm(emptyForm);

      window.setTimeout(() => {
        router.push("/login?role=ejecutivo");
      }, 1200);
    } catch {
      setError("No se pudo completar la invitación. Inténtalo de nuevo.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(109,40,217,0.12),_transparent_23%),_linear-gradient(180deg,_#f7f7fb_0%,_#eef0fb_100%)] p-5">
      <div className="w-full max-w-xl rounded-[28px] border border-border bg-white p-6 shadow-[0_18px_48px_rgba(16,16,36,0.08)] sm:p-8">
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
          <h1 className="mt-4 text-2xl font-bold tracking-[-0.04em] text-foreground">Completar invitación</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Crea tu cuenta de ejecutivo para acceder al panel administrativo de SmartPro.
          </p>
        </div>

        {isLoading ? (
          <p className="rounded-xl border border-border bg-soft-background px-4 py-3 text-sm text-muted-foreground">
            Validando invitación...
          </p>
        ) : loadError ? (
          <div className="space-y-4">
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{loadError}</p>
            <Link
              href="/login?role=ejecutivo"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-border bg-white px-4 text-sm font-semibold text-foreground"
            >
              Ir al inicio de sesión
            </Link>
          </div>
        ) : invitation ? (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-foreground">Correo</span>
                <input
                  type="email"
                  value={invitation.email}
                  readOnly
                  className="w-full cursor-not-allowed rounded-2xl border border-border bg-slate-100 px-4 py-3 text-base text-muted-foreground outline-none"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-foreground">Rol</span>
                <input
                  value={getExecutiveRoleLabel(invitation.role)}
                  readOnly
                  className="w-full cursor-not-allowed rounded-2xl border border-border bg-slate-100 px-4 py-3 text-base text-muted-foreground outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">Nombre</span>
                <input
                  value={form.firstName}
                  onChange={(event) => updateField("firstName", event.target.value)}
                  className={inputClassName}
                  placeholder="Nombre"
                  autoComplete="given-name"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">Apellido</span>
                <input
                  value={form.lastName}
                  onChange={(event) => updateField("lastName", event.target.value)}
                  className={inputClassName}
                  placeholder="Apellido"
                  autoComplete="family-name"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">RUT</span>
                <input
                  value={form.rut}
                  onChange={(event) => updateField("rut", event.target.value)}
                  className={inputClassName}
                  placeholder="12.345.678-9"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">Teléfono</span>
                <input
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  className={inputClassName}
                  placeholder="+56 9 1234 5678"
                  autoComplete="tel"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">Contraseña</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  className={inputClassName}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">Confirmar contraseña</span>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) => updateField("confirmPassword", event.target.value)}
                  className={inputClassName}
                  placeholder="Repite tu contraseña"
                  autoComplete="new-password"
                />
              </label>
            </div>

            {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            {success && (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-primary to-magenta px-6 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(109,40,217,0.2)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Creando cuenta..." : "Completar registro"}
            </button>
          </form>
        ) : null}
      </div>
    </main>
  );
}
