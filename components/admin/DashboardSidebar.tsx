"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { label: "Resumen", href: "/dashboard" },
  { label: "Compras", href: "/dashboard/compras" },
] as const;

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside className="hidden w-72 border-r border-border bg-white/80 p-5 backdrop-blur-sm lg:block">
      <div className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">SmartPro</p>
        <h1 className="mt-2 text-xl font-bold tracking-[-0.04em] text-foreground">Dashboard</h1>
      </div>

      <nav className="space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-11 items-center rounded-2xl px-4 text-sm font-medium transition ${
                isActive
                  ? "bg-gradient-to-r from-primary/10 to-magenta/10 text-primary"
                  : "text-muted hover:bg-primary/5 hover:text-primary"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-border bg-white px-4 text-sm font-semibold text-foreground"
      >
        Cerrar sesión
      </button>
    </aside>
  );
}
