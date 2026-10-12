"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell } from "lucide-react";

import { formatNotificationRelative } from "@/lib/notifications/format";
import type { AdminNotificationRecord } from "@/lib/notifications/types";
import { getAdminNotificationTypeLabel } from "@/lib/notifications/types";

type InboxPayload = {
  notifications: AdminNotificationRecord[];
  unreadCount: number;
};

export function NotificationCenter() {
  const pathname = usePathname();
  const router = useRouter();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [inbox, setInbox] = useState<InboxPayload>({ notifications: [], unreadCount: 0 });
  const [loading, setLoading] = useState(false);

  const loadInbox = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications?limit=8", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as InboxPayload;
      setInbox({
        notifications: Array.isArray(payload.notifications) ? payload.notifications : [],
        unreadCount: Number(payload.unreadCount) || 0,
      });
    } catch {
      // El botón permanece usable aunque falle el refresco.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInbox();
    const interval = window.setInterval(() => {
      void loadInbox();
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [loadInbox, pathname]);

  useEffect(() => {
    if (!open) return;

    const handlePointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointer);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handlePointer);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  async function markRead(id: string) {
    const response = await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    if (!response.ok) return;
    await loadInbox();
  }

  async function markAllRead() {
    const response = await fetch("/api/notifications/read-all", { method: "POST" });
    if (!response.ok) return;
    await loadInbox();
  }

  const unreadLabel = inbox.unreadCount > 9 ? "9+" : String(inbox.unreadCount);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={
          inbox.unreadCount > 0
            ? `Notificaciones, ${inbox.unreadCount} sin leer`
            : "Notificaciones"
        }
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setOpen((current) => !current);
          if (!open) void loadInbox();
        }}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-white text-navy transition hover:border-primary/25 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <Bell size={18} strokeWidth={1.8} />
        {inbox.unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-magenta px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadLabel}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Centro de notificaciones"
          className="absolute right-0 z-50 mt-2 w-[min(22.5rem,calc(100vw-2rem))] overflow-hidden rounded-[22px] border border-border bg-white shadow-[0_24px_60px_rgba(16,16,36,0.16)]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Notificaciones</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">
                {inbox.unreadCount > 0
                  ? `${inbox.unreadCount} sin leer`
                  : "Todo al día"}
              </p>
            </div>
            {inbox.unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Marcar leídas
              </button>
            ) : null}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && inbox.notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted">Cargando avisos…</p>
            ) : inbox.notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted">Aún no hay notificaciones.</p>
            ) : (
              <ul>
                {inbox.notifications.map((notification) => (
                  <li key={notification.id} className="border-t border-border first:border-t-0">
                    <button
                      type="button"
                      onClick={() => {
                        void markRead(notification.id);
                        setOpen(false);
                        if (notification.href) {
                          router.push(notification.href);
                        }
                      }}
                      className={`flex w-full flex-col items-start gap-1 px-4 py-3 text-left transition hover:bg-soft-background ${
                        notification.readAt ? "opacity-70" : ""
                      }`}
                    >
                      <span className="flex w-full items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                          {getAdminNotificationTypeLabel(notification.type)}
                        </span>
                        <span className="text-[11px] text-muted">{formatNotificationRelative(notification.createdAt)}</span>
                      </span>
                      <span className="text-sm font-semibold text-foreground">{notification.title}</span>
                      <span className="line-clamp-2 text-xs text-muted">{notification.body}</span>
                      {!notification.readAt ? (
                        <span className="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-magenta" />
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-border px-4 py-3">
            <Link
              href="/dashboard/notificaciones"
              onClick={() => setOpen(false)}
              className="inline-flex min-h-10 w-full items-center justify-center rounded-full border border-border px-4 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:text-primary"
            >
              Ver todas las notificaciones
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
