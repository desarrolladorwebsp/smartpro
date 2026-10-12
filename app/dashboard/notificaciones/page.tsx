import { Suspense } from "react";

import { DashboardDataError } from "@/components/admin/DashboardDataError";
import { NotificationsPageSkeleton } from "@/components/admin/dashboard-skeletons";
import { NotificationsDashboard } from "@/components/admin/NotificationsDashboard";
import { requireAdminSession } from "@/lib/auth";
import { listAdminNotifications } from "@/lib/notifications/repository";
import type { AdminNotificationRecord } from "@/lib/notifications/types";

export const dynamic = "force-dynamic";

export default function NotificationsPage() {
  return (
    <Suspense fallback={<NotificationsPageSkeleton />}>
      <NotificationsPageContent />
    </Suspense>
  );
}

async function NotificationsPageContent() {
  await requireAdminSession();

  let notifications: AdminNotificationRecord[] = [];
  let loadError = false;

  try {
    notifications = await listAdminNotifications({ limit: 500 });
  } catch (error) {
    console.error("[smartpro:dashboard:notificaciones] Error de conexión a la base de datos", error);
    loadError = true;
  }

  if (loadError) {
    return (
      <DashboardDataError
        icon="notificaciones"
        eyebrow="Seguimiento operativo"
        title="Notificaciones"
        message="No se pudieron cargar las notificaciones."
      />
    );
  }

  return <NotificationsDashboard initialNotifications={notifications} />;
}
