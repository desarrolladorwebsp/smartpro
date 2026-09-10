"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Bell, CalendarDays, FileText, LayoutDashboard, Package, Plus, ShoppingBag, Users, UserCog, ArrowLeft } from "lucide-react";

const HEADER_ICONS = {
  dashboard: LayoutDashboard,
  clientes: Users,
  cotizaciones: FileText,
  servicios: Package,
  compras: ShoppingBag,
  ejecutivos: UserCog,
  back: ArrowLeft,
  plus: Plus,
} as const;

type HeaderIconName = keyof typeof HEADER_ICONS;

type HeaderAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: HeaderIconName;
  variant?: "primary" | "secondary";
};

type DashboardPageHeaderProps = {
  icon?: HeaderIconName;
  leading?: ReactNode;
  eyebrow: string;
  title: string;
  action?: HeaderAction;
  trailing?: ReactNode;
};

function formatDashboardDate(date: Date) {
  const dateLabel = new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Santiago",
  }).format(date);

  const timeLabel = new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Santiago",
  }).format(date);

  return { dateLabel, timeLabel };
}

function DashboardHeaderClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 30_000);

    return () => window.clearInterval(interval);
  }, []);

  const { dateLabel, timeLabel } = formatDashboardDate(now);

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-soft-background text-primary">
        <CalendarDays size={16} strokeWidth={1.8} />
      </div>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-[13px] font-semibold capitalize text-foreground">{dateLabel}</p>
        <p className="text-[11px] text-muted">{timeLabel}</p>
      </div>
    </div>
  );
}

function HeaderActionButton({ action }: { action: HeaderAction }) {
  const Icon = HEADER_ICONS[action.icon ?? "plus"];
  const isPrimary = (action.variant ?? "primary") === "primary";
  const className = isPrimary
    ? "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-magenta px-4 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(109,40,217,0.22)] transition hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:px-5"
    : "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:px-5";

  const content = (
    <>
      <Icon size={16} strokeWidth={2.2} />
      <span className="whitespace-nowrap">{action.label}</span>
    </>
  );

  if (action.href) {
    return (
      <Link href={action.href} onClick={action.onClick} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={action.onClick} className={className}>
      {content}
    </button>
  );
}

export function DashboardPageHeader({
  icon,
  leading,
  eyebrow,
  title,
  action,
  trailing,
}: DashboardPageHeaderProps) {
  const Icon = icon ? HEADER_ICONS[icon] : null;

  return (
    <header className="-mx-4 -mt-4 rounded-none border-x-0 border-t-0 border-border bg-white px-4 py-4 shadow-[0_12px_30px_rgba(16,16,36,0.04)] sm:-mx-6 sm:-mt-6 sm:px-6 lg:-mx-8 lg:-mt-8 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          {leading ?? (
            Icon ? (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-magenta/15 text-primary ring-1 ring-primary/10">
                <Icon size={22} strokeWidth={1.8} />
              </div>
            ) : null
          )}

          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
            <h1 className="mt-1 truncate text-2xl font-bold tracking-[-0.05em] text-foreground sm:text-[1.85rem]">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:shrink-0 lg:justify-end">
          {trailing}

          <button
            type="button"
            aria-label="Notificaciones"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-white text-navy transition hover:border-primary/25 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <Bell size={18} strokeWidth={1.8} />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-magenta ring-2 ring-white" />
          </button>

          <DashboardHeaderClock />

          {action ? <HeaderActionButton action={action} /> : null}
        </div>
      </div>
    </header>
  );
}
