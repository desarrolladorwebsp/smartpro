import { formatCurrency } from "../orders/service";
import type { AdminNotificationDraft, AdminNotificationType } from "./types";

function draft(
  type: AdminNotificationType,
  input: {
    title: string;
    body: string;
    href: string;
    entityType: string;
    entityId: string;
    dedupeKey?: string;
  },
): AdminNotificationDraft {
  return {
    type,
    title: input.title,
    body: input.body,
    href: input.href,
    entityType: input.entityType,
    entityId: input.entityId,
    dedupeKey: input.dedupeKey ?? `${type}:${input.entityId}`,
  };
}

export function clientCreatedNotification(client: {
  id: string;
  companyName: string;
  contactFirstName: string;
  contactLastName: string;
}): AdminNotificationDraft {
  const contact = `${client.contactFirstName} ${client.contactLastName}`.trim();
  return draft("CLIENT_CREATED", {
    title: "Nuevo cliente registrado",
    body: contact ? `${client.companyName} · ${contact}` : client.companyName,
    href: `/dashboard/clientes/${client.id}`,
    entityType: "client",
    entityId: client.id,
  });
}

export function quoteCreatedNotification(quote: {
  id: string;
  number: string;
  clientCompany: string;
  total: number;
}): AdminNotificationDraft {
  return draft("QUOTE_CREATED", {
    title: `Cotización ${quote.number} creada`,
    body: `${quote.clientCompany} · ${formatCurrency(quote.total)}`,
    href: `/dashboard/cotizaciones/${quote.id}`,
    entityType: "quote",
    entityId: quote.id,
  });
}

export function quoteSentNotification(quote: {
  id: string;
  number: string;
  clientCompany: string;
  clientEmail: string;
}): AdminNotificationDraft {
  return draft("QUOTE_SENT", {
    title: `Cotización ${quote.number} enviada`,
    body: quote.clientEmail ? `${quote.clientCompany} · ${quote.clientEmail}` : quote.clientCompany,
    href: `/dashboard/cotizaciones/${quote.id}`,
    entityType: "quote",
    entityId: quote.id,
  });
}

export function quoteAcceptedNotification(quote: {
  id: string;
  number: string;
  clientCompany: string;
}): AdminNotificationDraft {
  return draft("QUOTE_ACCEPTED", {
    title: `Cotización ${quote.number} aceptada`,
    body: `${quote.clientCompany} aceptó la propuesta.`,
    href: `/dashboard/cotizaciones/${quote.id}`,
    entityType: "quote",
    entityId: quote.id,
  });
}

export function quoteRejectedNotification(quote: {
  id: string;
  number: string;
  clientCompany: string;
}): AdminNotificationDraft {
  return draft("QUOTE_REJECTED", {
    title: `Cotización ${quote.number} rechazada`,
    body: `${quote.clientCompany} rechazó la propuesta.`,
    href: `/dashboard/cotizaciones/${quote.id}`,
    entityType: "quote",
    entityId: quote.id,
  });
}

export function orderPaidNotification(order: {
  id: string;
  customer: { name: string; company?: string };
  total: number;
}): AdminNotificationDraft {
  const who = order.customer.company || order.customer.name;
  return draft("ORDER_PAID", {
    title: "Pago en línea confirmado",
    body: `${who} · ${formatCurrency(order.total)}`,
    href: `/dashboard/compras/${order.id}`,
    entityType: "order",
    entityId: order.id,
  });
}

export function orderCreatedNotification(order: {
  id: string;
  customer: { name: string; company?: string };
  total: number;
}): AdminNotificationDraft {
  const who = order.customer.company || order.customer.name;
  return draft("ORDER_CREATED", {
    title: "Nueva compra iniciada",
    body: `${who} · ${formatCurrency(order.total)}`,
    href: `/dashboard/compras/${order.id}`,
    entityType: "order",
    entityId: order.id,
  });
}

export function saleRegisteredNotification(sale: {
  id: string;
  number: string;
  clientId: string;
  clientCompany: string;
  total: number;
}): AdminNotificationDraft {
  return draft("SALE_REGISTERED", {
    title: `Venta ${sale.number} registrada`,
    body: `${sale.clientCompany} · ${formatCurrency(sale.total)}`,
    href: `/dashboard/ventas?clientId=${sale.clientId}`,
    entityType: "sale",
    entityId: sale.id,
  });
}

export function paymentReceivedNotification(payment: {
  id: string;
  saleId: string;
  saleNumber: string;
  clientId: string;
  clientCompany: string;
  amount: number;
}): AdminNotificationDraft {
  return draft("PAYMENT_RECEIVED", {
    title: `Abono en venta ${payment.saleNumber}`,
    body: `${payment.clientCompany} · ${formatCurrency(payment.amount)}`,
    href: `/dashboard/ventas?clientId=${payment.clientId}`,
    entityType: "salePayment",
    entityId: payment.id,
    dedupeKey: `PAYMENT_RECEIVED:${payment.id}`,
  });
}
