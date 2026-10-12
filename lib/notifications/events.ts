import {
  clientCreatedNotification,
  orderCreatedNotification,
  orderPaidNotification,
  paymentReceivedNotification,
  quoteAcceptedNotification,
  quoteCreatedNotification,
  quoteRejectedNotification,
  quoteSentNotification,
  saleRegisteredNotification,
} from "./copy";
import { createAdminNotification } from "./repository";
import type { AdminNotificationDraft } from "./types";

async function emit(draft: AdminNotificationDraft) {
  try {
    await createAdminNotification(draft);
  } catch (error) {
    console.error("[smartpro:notifications]", {
      type: draft.type,
      entityId: draft.entityId,
      error: error instanceof Error ? error.message : error,
    });
  }
}

export async function notifyClientCreated(client: {
  id: string;
  companyName: string;
  contactFirstName: string;
  contactLastName: string;
}) {
  await emit(clientCreatedNotification(client));
}

export async function notifyQuoteCreated(quote: {
  id: string;
  number: string;
  status: string;
  clientCompany: string;
  total: number;
}) {
  if (quote.status === "DRAFT") return;
  await emit(quoteCreatedNotification(quote));
}

export async function notifyQuoteSent(quote: {
  id: string;
  number: string;
  clientCompany: string;
  clientEmail: string;
}) {
  await emit(quoteSentNotification(quote));
}

export async function notifyQuoteStatusChanged(quote: {
  id: string;
  number: string;
  status: string;
  clientCompany: string;
}) {
  if (quote.status === "ACCEPTED") {
    await emit(quoteAcceptedNotification(quote));
    return;
  }

  if (quote.status === "REJECTED") {
    await emit(quoteRejectedNotification(quote));
  }
}

export async function notifyOrderPaid(order: {
  id: string;
  customer: { name: string; company?: string };
  total: number;
}) {
  await emit(orderPaidNotification(order));
}

export async function notifyOrderCreated(order: {
  id: string;
  customer: { name: string; company?: string };
  total: number;
}) {
  await emit(orderCreatedNotification(order));
}

export async function notifySaleRegistered(sale: {
  id: string;
  number: string;
  clientId: string;
  clientCompany: string;
  total: number;
}) {
  await emit(saleRegisteredNotification(sale));
}

export async function notifyPaymentReceived(payment: {
  id: string;
  saleId: string;
  saleNumber: string;
  clientId: string;
  clientCompany: string;
  amount: number;
}) {
  await emit(paymentReceivedNotification(payment));
}
