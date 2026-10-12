export const ADMIN_NOTIFICATION_TYPES = [
  "CLIENT_CREATED",
  "QUOTE_CREATED",
  "QUOTE_SENT",
  "QUOTE_ACCEPTED",
  "QUOTE_REJECTED",
  "ORDER_CREATED",
  "ORDER_PAID",
  "SALE_REGISTERED",
  "PAYMENT_RECEIVED",
] as const;

export type AdminNotificationType = (typeof ADMIN_NOTIFICATION_TYPES)[number];

export const ADMIN_NOTIFICATION_TYPE_LABELS: Record<AdminNotificationType, string> = {
  CLIENT_CREATED: "Cliente nuevo",
  QUOTE_CREATED: "Cotización creada",
  QUOTE_SENT: "Cotización enviada",
  QUOTE_ACCEPTED: "Cotización aceptada",
  QUOTE_REJECTED: "Cotización rechazada",
  ORDER_CREATED: "Compra iniciada",
  ORDER_PAID: "Pago en línea",
  SALE_REGISTERED: "Venta registrada",
  PAYMENT_RECEIVED: "Abono recibido",
};

export type AdminNotificationRecord = {
  id: string;
  type: AdminNotificationType;
  title: string;
  body: string;
  href: string;
  entityType: string;
  entityId: string;
  dedupeKey: string;
  readAt: string | null;
  createdAt: string;
};

export type AdminNotificationDraft = {
  type: AdminNotificationType;
  title: string;
  body: string;
  href: string;
  entityType: string;
  entityId: string;
  dedupeKey: string;
};

export function isAdminNotificationType(value: unknown): value is AdminNotificationType {
  return ADMIN_NOTIFICATION_TYPES.includes(value as AdminNotificationType);
}

export function getAdminNotificationTypeLabel(type: AdminNotificationType): string {
  return ADMIN_NOTIFICATION_TYPE_LABELS[type] ?? type;
}
