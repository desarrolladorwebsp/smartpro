"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Briefcase, Check, Eye, EyeOff, Lock, Mail, UserPlus, UserRound } from "lucide-react";

const REMEMBERED_EMAIL_KEY = "smartpro-login-email";

const roleOptions = {
  cliente: {
    label: "Cliente",
    title: "Iniciar sesión",
    placeholder: "tu@correo.cl",
  },
  ejecutivo: {
    label: "Usuario interno",
    title: "Iniciar sesión",
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

const fieldLabelClassName =
  "mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55";

const inputClassName =
  "w-full rounded-full border border-white/10 bg-white/[0.06] py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#a78bfa]/70 focus:bg-white/[0.09] focus:shadow-[0_0_0_3px_rgba(109,40,217,0.18)] [&:-webkit-autofill]:[-webkit-text-fill-color:#fff] [&:-webkit-autofill]:[transition:background-color_9999s_ease-out_0s]";

function LoginAtmosphere({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-[#08081a] text-white">
      <div
        className="pointer-events-none absolute -left-28 -top-28 h-[28rem] w-[28rem] rounded-full bg-[#4f46e5]/45 blur-[140px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-36 -right-16 h-[32rem] w-[32rem] rounded-full bg-[#ec168c]/40 blur-[150px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-1/2 top-[18%] h-64 w-64 -translate-x-1/2 rounded-full bg-[#6d28d9]/20 blur-[90px]"
        aria-hidden="true"
      />
      {children}
    </main>
  );
}

function BrandMark() {
  return (
    <div className="mb-4 flex justify-center sm:mb-5">
      <Image
        src="/images/logo/logo-smartpro-full.png"
        alt="SmartPro"
        width={280}
        height={93}
        priority
        className="h-auto w-[168px] object-contain sm:w-[188px]"
      />
    </div>
  );
}

function RoleSwitch({
  selectedRole,
  onSelect,
}: {
  selectedRole: RoleKey;
  onSelect: (role: RoleKey) => void;
}) {
  return (
    <div
      className="grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1"
      role="tablist"
      aria-label="Tipo de acceso"
    >
      {(
        [
          { role: "cliente", icon: UserRound },
          { role: "ejecutivo", icon: Briefcase },
        ] as const
      ).map(({ role, icon: Icon }) => {
        const selected = selectedRole === role;

        return (
          <button
            key={role}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onSelect(role)}
            className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition ${
              selected
                ? "bg-white text-[#12122a] shadow-[0_8px_20px_rgba(0,0,0,0.28)]"
                : "text-white/50 hover:bg-white/[0.06] hover:text-white/85"
            }`}
          >
            <Icon className="h-4 w-4" />
            {roleOptions[role].label}
          </button>
        );
      })}
    </div>
  );
}

function LoginFooter() {
  return (
    <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between px-5 pb-4 sm:px-8 sm:pb-5">
      <div className="pointer-events-auto hidden items-start gap-3 md:flex">
        <span className="mt-1 h-8 w-0.5 rounded-full bg-brand-gradient" aria-hidden="true" />
        <p className="text-[10px] font-semibold uppercase leading-4 tracking-[0.28em] text-white/50">
          Ideas
          <br />
          Tecnología
          <br />
          Resultados
        </p>
      </div>

      <nav className="pointer-events-auto mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-white/45 md:absolute md:bottom-5 md:left-1/2 md:mx-0 md:-translate-x-1/2 md:text-xs">
        <Link href="/" className="transition hover:text-white">
          www.smartpro.cl
        </Link>
        <span aria-hidden="true">|</span>
        <a href="mailto:contacto@smartpro.cl" className="transition hover:text-white">
          Soporte
        </a>
        <span aria-hidden="true">|</span>
        <Link href="/politica-privacidad" className="transition hover:text-white">
          Política de privacidad
        </Link>
      </nav>

      <div className="hidden w-[7.5rem] md:block" aria-hidden="true" />
    </footer>
  );
}

export default function LoginForm({ initialRole }: { initialRole: RoleKey }) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<RoleKey>(initialRole);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const activeRole = useMemo(() => roleOptions[selectedRole], [selectedRole]);

  useEffect(() => {
    try {
      const remembered = window.localStorage.getItem(REMEMBERED_EMAIL_KEY);
      if (remembered) {
        setForm((current) => ({ ...current, email: remembered }));
        setRememberMe(true);
      }
    } catch {
      // Ignore storage access issues.
    }
  }, []);

  const handleRoleSelect = (role: RoleKey) => {
    setSelectedRole(role);
    setMode("login");
    setError("");
    setSuccess("");
    setShowPassword(false);
    router.replace(`/login?role=${role}`, { scroll: false });
  };

  const persistRememberedEmail = (email: string) => {
    try {
      if (rememberMe && email) {
        window.localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
      } else {
        window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }
    } catch {
      // Ignore storage access issues.
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (selectedRole === "cliente") {
      persistRememberedEmail(form.email.trim());
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

      persistRememberedEmail(email);
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
    <LoginAtmosphere>
      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-5 py-16 sm:py-14">
        <BrandMark />

        <div
          className={`w-full rounded-[26px] border border-white/10 bg-[rgb(16_16_40_/_0.62)] p-5 shadow-[0_0_0_1px_rgba(139,92,246,0.12),0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-7 ${
            mode === "register" ? "max-w-xl" : "max-w-[26rem]"
          }`}
        >
          {mode === "register" && selectedRole === "cliente" ? (
            <form onSubmit={handleRegister} className="space-y-4" noValidate>
              <div className="mb-2 text-center">
                <h1 className="text-[1.65rem] font-semibold tracking-[-0.04em] text-white">Crear cuenta</h1>
                <p className="mt-1.5 text-sm text-white/50">Regístrate como cliente para continuar</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={fieldLabelClassName}>Nombre</span>
                  <input
                    value={registerForm.firstName}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, firstName: event.target.value }))}
                    className={`${inputClassName} px-4`}
                    placeholder="Nombre"
                    autoComplete="given-name"
                  />
                </label>

                <label className="block">
                  <span className={fieldLabelClassName}>Apellido</span>
                  <input
                    value={registerForm.lastName}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, lastName: event.target.value }))}
                    className={`${inputClassName} px-4`}
                    placeholder="Apellido"
                    autoComplete="family-name"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className={fieldLabelClassName}>Nombre del negocio</span>
                  <input
                    value={registerForm.businessName}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, businessName: event.target.value }))}
                    className={`${inputClassName} px-4`}
                    placeholder="SmartPro Agency"
                    autoComplete="organization"
                  />
                </label>

                <label className="block">
                  <span className={fieldLabelClassName}>RUT (opcional)</span>
                  <input
                    value={registerForm.rut}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, rut: event.target.value }))}
                    className={`${inputClassName} px-4`}
                    placeholder="12.345.678-9"
                  />
                </label>

                <label className="block">
                  <span className={fieldLabelClassName}>Teléfono</span>
                  <input
                    value={registerForm.phone}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, phone: event.target.value }))}
                    className={`${inputClassName} px-4`}
                    placeholder="+56 9 1234 5678"
                    autoComplete="tel"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className={fieldLabelClassName}>Email</span>
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                    className={`${inputClassName} px-4`}
                    placeholder="cliente@smartpro.cl"
                    autoComplete="email"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className={fieldLabelClassName}>Contraseña</span>
                  <input
                    type="password"
                    value={registerForm.password}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                    className={`${inputClassName} px-4`}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                  />
                </label>
              </div>

              {error && (
                <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError("");
                    setSuccess("");
                  }}
                  className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Volver
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-brand-gradient px-6 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(109,40,217,0.35)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Registrando..." : "Crear cuenta"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="text-center">
                <h1 className="text-[1.5rem] font-semibold tracking-[-0.04em] text-white">{activeRole.title}</h1>
              </div>

              <RoleSwitch selectedRole={selectedRole} onSelect={handleRoleSelect} />

              <label className="block">
                <span className={fieldLabelClassName}>Correo electrónico</span>
                <span className="relative block">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <input
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    className={`${inputClassName} pl-11 pr-4`}
                    placeholder={activeRole.placeholder}
                  />
                </span>
              </label>

              <label className="block">
                <span className={fieldLabelClassName}>Contraseña</span>
                <span className="relative block">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    className={`${inputClassName} px-11`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white/40 transition hover:text-white"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
              </label>

              {error && (
                <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>
              )}

              {success && (
                <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                  {success}
                </p>
              )}

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={rememberMe}
                  onClick={() => setRememberMe((current) => !current)}
                  className="flex items-center gap-2 text-left text-[13px] text-white/60"
                >
                  <span
                    className={`relative flex size-4 shrink-0 items-center justify-center rounded-[5px] border transition ${
                      rememberMe ? "border-primary bg-primary" : "border-white/25 bg-transparent"
                    }`}
                    aria-hidden="true"
                  >
                    {rememberMe ? <Check className="h-3 w-3 text-white" /> : null}
                  </span>
                  Mantener sesión iniciada
                </button>

                <a
                  href="mailto:contacto@smartpro.cl?subject=Recuperar%20contrase%C3%B1a"
                  className="shrink-0 text-[13px] text-[#c4b5fd] transition hover:text-white"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-gradient px-6 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(236,22,140,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Iniciando sesión..." : "Ingresar"}
                <ArrowRight className="h-4 w-4" />
              </button>

              {selectedRole === "cliente" ? (
                <>
                  <div className="relative py-1">
                    <div className="h-px bg-white/10" />
                    <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25" />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMode("register");
                      setError("");
                      setSuccess("");
                    }}
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3.5 text-sm font-medium text-white/90 transition hover:border-white/25 hover:bg-white/[0.08]"
                  >
                    <UserPlus className="h-4 w-4 text-white/70" />
                    Registrarme como cliente
                  </button>
                </>
              ) : null}
            </form>
          )}
        </div>
      </div>

      <LoginFooter />
    </LoginAtmosphere>
  );
}
