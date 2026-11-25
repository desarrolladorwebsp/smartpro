import type { AdminSessionRole } from "../auth";
import { isCollectionAlertId, listCollectionAlerts, markCollectionAlertsRead } from "../sales/collection-alerts";
import { countUnreadAdminNotifications, listAdminNotifications, markAdminNotificationRead, markAllAdminNotificationsRead, type ListAdminNotificationsOptions } from "./repository";

type Session = { email: string; role: AdminSessionRole };

export async function listDashboardNotifications(session: Session, options: ListAdminNotificationsOptions = {}) {
  const onlyCollections = options.type === "SALE_COLLECTION_DUE";
  const includeCollections = !options.type || options.type === "ALL" || onlyCollections;
  const limit = Math.min(Math.max(options.limit ?? 200, 1), 500);
  const [general, collection, generalUnread] = await Promise.all([
    onlyCollections ? [] : listAdminNotifications({ ...options, limit }),
    listCollectionAlerts(session),
    countUnreadAdminNotifications(),
  ]);
  const query = options.query?.trim().toLowerCase();
  const matchingCollection = includeCollections ? collection.filter((notice) =>
    (!options.unreadOnly || !notice.readAt) && (!query || `${notice.title} ${notice.body}`.toLowerCase().includes(query))) : [];
  const notifications = [...general, ...matchingCollection]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, limit);
  return { notifications, unreadCount: generalUnread + collection.filter((notice) => !notice.readAt).length };
}

export async function markDashboardNotificationRead(session: Session, id: string) {
  if (!isCollectionAlertId(id)) return markAdminNotificationRead(id);
  const notice = (await listCollectionAlerts(session)).find((entry) => entry.id === id);
  if (!notice) return null;
  await markCollectionAlertsRead([notice]);
  return { ...notice, readAt: notice.readAt ?? new Date().toISOString() };
}

export async function markAllDashboardNotificationsRead(session: Session) {
  const collection = await listCollectionAlerts(session);
  const [generalCount, collectionCount] = await Promise.all([
    markAllAdminNotificationsRead(),
    markCollectionAlertsRead(collection),
  ]);
  return generalCount + collectionCount;
}
