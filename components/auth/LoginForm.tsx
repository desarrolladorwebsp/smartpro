"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

const roleOptions = {
  cliente: {
    label: "Cliente",
    title: "Ingresar como cliente",
    description: "Accede a tu área de clientes, seguimiento y consultas.",
    placeholder: "cliente@smartpro.cl",
  },
  ejecutivo: {
    label: "Ejecutivo",
    title: "Ingresar como ejecutivo",
    description: "Acceso administrativo para gestión interna y reportes.",
    placeholder: "contacto@smartpro.cl",
  },
} as const;

type RoleKey = keyof typeof roleOptions;

const emptyRegisterForm = {
  firstName: "",
  lastName: "",
  businessName: "",
  rut: "",
  email: "",
  phone: "",
  password: "",
};

const inputClassName =
  "w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition focus:border-primary";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = (searchParams.get("role") as RoleKey | null) ?? null;
  const [selectedRole, setSelectedRole] = useState<RoleKey | null>(
    initialRole && roleOptions[initialRole] ? initialRole : null,
  );
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeRole = useMemo(
    () => (selectedRole ? roleOptions[selectedRole] : null),
    [selectedRole],
  );

  const handleRoleSelect = (role: RoleKey) => {
    setSelectedRole(role);
    setMode("login");
    setError("");
    setSuccess("");
    router.push(`/login?role=${role}`);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (selectedRole === "cliente") {
      router.push("/checkout");
      return;
    }

    const email = form.email.trim();
    const password = form.password;

    if (!email || !password) {
      setError("Ingresa email y contraseña.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

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

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/clients/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerForm),
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "No se pudo registrar el cliente.");
        setIsSubmitting(false);
        return;
      }

      setRegisterForm(emptyRegisterForm);
      setForm({ email: registerForm.email, password: "" });
      setMode("login");
      setSuccess("Cuenta creada. Ya puedes iniciar sesión.");
    } catch {
      setError("No se pudo registrar el cliente. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(109,40,217,0.12),_transparent_23%),_linear-gradient(180deg,_#f7f7fb_0%,_#eef0fb_100%)] p-5">
      <div className={`w-full rounded-[28px] border border-border bg-white p-6 shadow-[0_18px_48px_rgba(16,16,36,0.08)] sm:p-8 ${mode === "register" ? "max-w-xl" : "max-w-md"}`}>
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
          <h1 className="mt-4 text-2xl font-bold tracking-[-0.04em] text-foreground">
            {mode === "register" ? "Crear cuenta" : "Iniciar sesión"}
          </h1>
        </div>

        {!selectedRole ? (
          <div className="space-y-3">
            <p className="mb-2 text-sm text-muted-foreground">Selecciona cómo quieres ingresar</p>
            {(Object.keys(roleOptions) as RoleKey[]).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleSelect(role)}
                className="flex w-full items-center justify-between rounded-2xl border border-border bg-soft-background px-4 py-4 text-left transition hover:border-primary hover:bg-primary/5"
              >
                <div>
                  <div className="text-base font-semibold text-foreground">{roleOptions[role].label}</div>
                  <div className="text-sm text-muted-foreground">{roleOptions[role].description}</div>
                </div>
                <span className="text-lg text-primary">→</span>
              </button>
            ))}
          </div>
        ) : mode === "register" && selectedRole === "cliente" ? (
          <form onSubmit={handleRegister} className="space-y-4" noValidate>
            <div className="mb-2 rounded-2xl bg-primary/5 p-3 text-sm text-foreground">
              <span className="font-semibold">Registrarse como cliente</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">Nombre</span>
                <input
                  value={registerForm.firstName}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, firstName: event.target.value }))}
                  className={inputClassName}
                  placeholder="Nombre"
                  autoComplete="given-name"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">Apellido</span>
                <input
                  value={registerForm.lastName}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, lastName: event.target.value }))}
                  className={inputClassName}
                  placeholder="Apellido"
                  autoComplete="family-name"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-foreground">Nombre del negocio</span>
                <input
                  value={registerForm.businessName}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, businessName: event.target.value }))}
                  className={inputClassName}
                  placeholder="SmartPro Agency"
                  autoComplete="organization"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">RUT</span>
                <input
                  value={registerForm.rut}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, rut: event.target.value }))}
                  className={inputClassName}
                  placeholder="12.345.678-9"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">Teléfono</span>
                <input
                  value={registerForm.phone}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, phone: event.target.value }))}
                  className={inputClassName}
                  placeholder="+56 9 1234 5678"
                  autoComplete="tel"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-foreground">Email</span>
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                  className={inputClassName}
                  placeholder="cliente@smartpro.cl"
                  autoComplete="email"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-foreground">Contraseña</span>
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                  className={inputClassName}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                />
              </label>
            </div>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setSuccess("");
                }}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-border bg-white px-4 text-sm font-semibold text-foreground"
              >
                Volver
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-gradient-to-r from-primary to-magenta px-6 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(109,40,217,0.2)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Registrando..." : "Crear cuenta"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="mb-2 rounded-2xl bg-primary/5 p-3 text-sm text-foreground">
              <span className="font-semibold">{activeRole?.title}</span>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground">Email</span>
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className={inputClassName}
                placeholder={activeRole?.placeholder}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground">Contraseña</span>
              <input
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className={inputClassName}
                placeholder="••••••••"
              />
            </label>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            {success && (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole(null);
                  setMode("login");
                  setError("");
                  setSuccess("");
                }}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-border bg-white px-4 text-sm font-semibold text-foreground"
              >
                Cambiar rol
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-gradient-to-r from-primary to-magenta px-6 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(109,40,217,0.2)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Iniciando sesión..." : selectedRole === "cliente" ? "Continuar" : "Iniciar sesión"}
              </button>
            </div>

            {selectedRole === "cliente" && (
              <p className="pt-1 text-center text-sm text-muted-foreground">
                ¿No tienes cuenta?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setError("");
                    setSuccess("");
                  }}
                  className="font-semibold text-primary"
                >
                  Regístrate como cliente
                </button>
              </p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
