"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  UserCog,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Resumen", href: "/dashboard", icon: LayoutDashboard, adminOnly: false },
  { label: "Clientes", href: "/dashboard/clientes", icon: Users, adminOnly: false },
  { label: "Cotizaciones", href: "/dashboard/cotizaciones", icon: FileText, adminOnly: false },
  { label: "Servicios", href: "/dashboard/servicios", icon: Package, adminOnly: false },
  { label: "Ventas", href: "/dashboard/ventas", icon: ShoppingBag, adminOnly: false },
  { label: "Ejecutivos", href: "/dashboard/ejecutivos", icon: UserCog, adminOnly: true },
] as const;

const LOGO_SRC = "/images/logo/logo-smartpro-full.png";

function isNavItemActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  if (href === "/dashboard/ventas") {
    return pathname === href || pathname.startsWith(`${href}/`) || pathname.startsWith("/dashboard/compras");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getEmailInitials(email: string) {
  const local = email.split("@")[0]?.trim() || "AD";
  const parts = local.split(/[._-]+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }

  return local.slice(0, 2).toUpperCase();
}

type DashboardSidebarProps = {
  adminEmail: string;
  role?: "ADMIN" | "EXECUTIVE";
};

export function DashboardSidebar({ adminEmail, role = "ADMIN" }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const drawerId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/login");
  }

  useEffect(() => {
    if (!isMobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-navy px-4 lg:hidden">
        <Link href="/dashboard" prefetch onClick={() => setIsMobileOpen(false)} aria-label="Ir al resumen del dashboard" className="flex min-w-0 items-center">
          <Image
            src={LOGO_SRC}
            alt="SmartPro"
            width={168}
            height={48}
            priority
            className="h-9 w-auto max-w-[168px] object-contain object-left"
          />
        </Link>

        <button
          ref={menuButtonRef}
          type="button"
          aria-label={isMobileOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
          aria-expanded={isMobileOpen}
          aria-controls={drawerId}
          onClick={() => setIsMobileOpen((current) => !current)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
        >
          {isMobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      <aside className="hidden w-64 shrink-0 flex-col bg-[linear-gradient(180deg,_#14142c_0%,_#101024_58%,_#0c0c1c_100%)] text-white lg:sticky lg:top-0 lg:flex lg:h-screen xl:w-72">
        <SidebarPanel
          adminEmail={adminEmail}
          role={role}
          pathname={pathname}
          onLogout={handleLogout}
          onNavigate={() => setIsMobileOpen(false)}
        />
      </aside>

      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Cerrar menú de navegación"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 z-50 cursor-default bg-navy/50 backdrop-blur-sm lg:hidden"
            />

            <motion.aside
              id={drawerId}
              role="dialog"
              aria-modal="true"
              aria-label="Navegación del dashboard"
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="fixed inset-y-0 left-0 z-[60] flex w-[min(18.5rem,86vw)] flex-col bg-[linear-gradient(180deg,_#14142c_0%,_#101024_58%,_#0c0c1c_100%)] text-white shadow-[20px_0_50px_rgba(11,11,20,0.28)] lg:hidden"
            >
              <div className="flex justify-end px-4 pt-4">
                <button
                  ref={closeButtonRef}
                  type="button"
                  aria-label="Cerrar menú de navegación"
                  onClick={() => setIsMobileOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                >
                  <X size={16} />
                </button>
              </div>

              <SidebarPanel
                adminEmail={adminEmail}
                role={role}
                pathname={pathname}
                onLogout={handleLogout}
                onNavigate={() => setIsMobileOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarPanel({
  adminEmail,
  role,
  pathname,
  onLogout,
  onNavigate,
}: {
  adminEmail: string;
  role: "ADMIN" | "EXECUTIVE";
  pathname: string;
  onLogout: () => void;
  onNavigate: () => void;
}) {
  const initials = getEmailInitials(adminEmail);
  const visibleNavItems = NAV_ITEMS.filter((item) => !item.adminOnly || role === "ADMIN");
  const roleLabel = role === "ADMIN" ? "Administrador" : "Ejecutivo";

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col px-4 pb-5 pt-4 xl:px-5">
      <div className="mb-7 px-1">
        <Link href="/dashboard" prefetch onClick={onNavigate} aria-label="Ir al resumen del dashboard" className="block">
          <Image
            src={LOGO_SRC}
            alt="SmartPro"
            width={196}
            height={56}
            priority
            className="h-11 w-auto max-w-[196px] object-contain object-left"
          />
        </Link>
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
          Panel administrativo
        </p>
      </div>

      <nav aria-label="Navegación principal" className="min-h-0 flex-1 space-y-1.5">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isNavItemActive(pathname, item.href)}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-magenta text-xs font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{adminEmail}</p>
            <p className="text-[11px] text-white/50">{roleLabel}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white transition hover:border-magenta/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
        >
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: { label: string; href: string; icon: LucideIcon };
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={item.href}
      prefetch
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`group flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 ${
        active
          ? "bg-gradient-to-r from-primary to-magenta text-white shadow-[0_10px_24px_rgba(109,40,217,0.28)]"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
    >
      <NavLinkInner item={item} active={active} />
    </Link>
  );
}

function NavLinkInner({
  item,
  active,
}: {
  item: { label: string; href: string; icon: LucideIcon };
  active: boolean;
}) {
  const { pending } = useLinkStatus();
  const Icon = item.icon;

  return (
    <>
      <Icon
        size={17}
        strokeWidth={1.8}
        className={active ? "text-white" : "text-white/45 transition group-hover:text-white"}
      />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 shrink-0 rounded-full bg-current transition-opacity duration-200 ${
          pending && !active ? "animate-pulse opacity-70" : "opacity-0"
        }`}
      />
    </>
  );
}

export function DashboardSidebarFallback() {
  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-navy px-4 lg:hidden">
        <div className="h-9 w-40 animate-pulse rounded-lg bg-white/10" />
        <div className="h-11 w-11 animate-pulse rounded-2xl bg-white/10" />
      </header>

      <aside className="hidden w-64 shrink-0 flex-col bg-[linear-gradient(180deg,_#14142c_0%,_#101024_58%,_#0c0c1c_100%)] text-white lg:sticky lg:top-0 lg:flex lg:h-screen xl:w-72">
        <div className="flex h-full min-h-0 flex-1 flex-col px-4 pb-5 pt-4 xl:px-5">
          <div className="mb-7 px-1">
            <div className="h-11 w-44 animate-pulse rounded-xl bg-white/10" />
            <div className="mt-3 h-2.5 w-32 animate-pulse rounded-full bg-white/10" />
          </div>

          <nav aria-hidden="true" className="min-h-0 flex-1 space-y-1.5">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex min-h-11 items-center gap-3 rounded-2xl px-3">
                <div className="h-4 w-4 animate-pulse rounded bg-white/10" />
                <div className="h-3 w-24 animate-pulse rounded-full bg-white/10" />
              </div>
            ))}
          </nav>

          <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
            <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-3">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-white/10" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-28 animate-pulse rounded-full bg-white/10" />
                <div className="h-2.5 w-20 animate-pulse rounded-full bg-white/10" />
              </div>
            </div>
            <div className="h-11 w-full animate-pulse rounded-full bg-white/10" />
          </div>
        </div>
      </aside>
    </>
  );
}
