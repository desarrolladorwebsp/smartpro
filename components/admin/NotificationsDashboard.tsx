"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { DashboardEmptyState } from "@/components/admin/DashboardEmptyState";
import { DashboardPageHeader } from "@/components/admin/DashboardPageHeader";
import { formatNotificationDateTime } from "@/lib/notifications/format";
import {
  ADMIN_NOTIFICATION_TYPES,
  getAdminNotificationTypeLabel,
  type AdminNotificationRecord,
  type AdminNotificationType,
} from "@/lib/notifications/types";

type Filter = "ALL" | "UNREAD" | "READ";

type NotificationsDashboardProps = {
  initialNotifications: AdminNotificationRecord[];
};

export function NotificationsDashboard({
  initialNotifications,
}: NotificationsDashboardProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<AdminNotificationType | "ALL">("ALL");
  const [readFilter, setReadFilter] = useState<Filter>("ALL");
  const [busy, setBusy] = useState(false);

  const unreadCount = notifications.filter((item) => !item.readAt).length;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notifications.filter((item) => {
      const matchesSearch =
        !query ||
        [item.title, item.body, getAdminNotificationTypeLabel(item.type)].join(" ").toLowerCase().includes(query);
      const matchesType = typeFilter === "ALL" || item.type === typeFilter;
      const matchesRead =
        readFilter === "ALL" || (readFilter === "UNREAD" ? !item.readAt : Boolean(item.readAt));
      return matchesSearch && matchesType && matchesRead;
    });
  }, [notifications, search, typeFilter, readFilter]);

  async function markRead(id: string) {
    setBusy(true);
    try {
      const response = await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      if (!response.ok) return;
      const payload = (await response.json()) as { notification?: AdminNotificationRecord };
      if (payload.notification) {
        setNotifications((current) =>
          current.map((item) => (item.id === id ? payload.notification! : item)),
        );
      }
    } finally {
      setBusy(false);
    }
  }

  async function markAllRead() {
    setBusy(true);
    try {
      const response = await fetch("/api/notifications/read-all", { method: "POST" });
      if (!response.ok) return;
      const now = new Date().toISOString();
      setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? now })));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        icon="notificaciones"
        eyebrow="Seguimiento operativo"
        title="Notificaciones"
        trailing={
          <p className="text-sm font-semibold text-muted">
            {unreadCount} sin leer
          </p>
        }
        action={
          unreadCount > 0
            ? { label: "Marcar todas como leídas", onClick: () => void markAllRead(), icon: "check", variant: "secondary" }
            : undefined
        }
      />

      <div className="rounded-[24px] border border-border bg-white p-4 shadow-[0_18px_46px_rgba(16,16,36,0.04)] sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="dashboard-field md:col-span-2 xl:col-span-1"
            placeholder="Buscar título o detalle"
          />
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as AdminNotificationType | "ALL")}
            className="dashboard-field"
          >
            <option value="ALL">Todos los tipos</option>
            {ADMIN_NOTIFICATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {getAdminNotificationTypeLabel(type)}
              </option>
            ))}
          </select>
          <select
            value={readFilter}
            onChange={(event) => setReadFilter(event.target.value as Filter)}
            className="dashboard-field"
          >
            <option value="ALL">Todas</option>
            <option value="UNREAD">Sin leer</option>
            <option value="READ">Leídas</option>
          </select>
        </div>
      </div>

      {notifications.length === 0 ? (
        <DashboardEmptyState
          title="No hay notificaciones todavía"
          description="Los avisos de clientes, cotizaciones, pagos y ventas aparecerán aquí automáticamente."
        />
      ) : filtered.length === 0 ? (
        <DashboardEmptyState
          title="Sin resultados"
          description="Prueba con otro tipo, estado o término de búsqueda."
        />
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-border bg-white shadow-[0_18px_46px_rgba(16,16,36,0.04)]">
          <ul className="divide-y divide-border">
            {filtered.map((notification) => (
              <li key={notification.id} className={notification.readAt ? "bg-white" : "bg-primary/[0.03]"}>
                <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                      {getAdminNotificationTypeLabel(notification.type)}
                    </p>
                    <h2 className="mt-1 text-base font-semibold tracking-[-0.03em] text-foreground">
                      {notification.title}
                    </h2>
                    <p className="mt-1 text-sm text-muted">{notification.body}</p>
                    <p className="mt-2 text-xs text-muted">{formatNotificationDateTime(notification.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {notification.href ? (
                      <Link
                        href={notification.href}
                        onClick={() => {
                          if (!notification.readAt) void markRead(notification.id);
                        }}
                        className="inline-flex min-h-10 items-center justify-center rounded-full border border-border px-4 text-xs font-semibold"
                      >
                        Abrir
                      </Link>
                    ) : null}
                    {!notification.readAt ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void markRead(notification.id)}
                        className="inline-flex min-h-10 items-center justify-center rounded-full bg-gradient-to-r from-primary to-magenta px-4 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        Marcar leída
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-muted">Leída</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
