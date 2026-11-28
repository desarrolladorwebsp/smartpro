import { randomBytes } from "node:crypto";
import type { Prisma, SalePaymentRequest } from "@prisma/client";
import { z } from "zod";

import { SMARTPRO_AGENCY_ID } from "../agencies/types";
import { getAppUrl } from "../app-url";
import type { AdminSessionRole } from "../auth";
import { parseContactSnapshot } from "../clients/commercial-clients";
import { prisma } from "../db";
import { sendEmail } from "../email/resend";
import { renderCorporateEmail } from "../email/template";
import { notifyPaymentReceived } from "../notifications/events";
import { formatCurrency } from "../orders/service";
import { getWebpayTransaction, isAllowedWebpayRedirectUrl, isWebpayApproved, toWebpayCommitSnapshot } from "../webpay";
import type { ClassifiedWebpayReturn } from "../webpay/return-params";
import type { WebpayCommitSnapshot } from "../webpay/status";
import { getBalanceDue, parseSalePaymentAmount, sumPaidAmount } from "./balances";
import { getSaleCollection } from "./collection-repository";

type Session = { email: string; role: AdminSessionRole };
type Gateway = Pick<ReturnType<typeof getWebpayTransaction>, "create" | "commit" | "status">;

export type PaymentRequestSummary = {
  id: string;
  amount: number;
  status: "PENDING" | "PROCESSING" | "PAID" | "CANCELLED";
  createdAt: string;
  emailAcceptedAt: string | null;
  recipient: string | null;
  url: string;
};

export class PaymentRequestError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

function database() {
  if (!prisma) throw new Error("No hay conexión a la base de datos.");
  return prisma;
}

export function validPaymentRequestToken(value: string) {
  return /^[a-f0-9]{64}$/.test(value);
}

export function paymentRequestPath(id: string) {
  return `/pagar/abono/${id}`;
}

function requestStatus(row: Pick<SalePaymentRequest, "status" | "webpayToken">): PaymentRequestSummary["status"] {
  return row.status === "PENDING" && row.webpayToken ? "PROCESSING" : row.status;
}

function summary(row: SalePaymentRequest): PaymentRequestSummary {
  return {
    id: row.id, amount: Number(row.amount), status: requestStatus(row), url: getAppUrl() + paymentRequestPath(row.id),
    createdAt: row.createdAt.toISOString(), emailAcceptedAt: row.emailAcceptedAt?.toISOString() ?? null, recipient: row.recipient,
  };
}

function recipientEmail(...candidates: (string | null | undefined)[]) {
  const email = z.string().email().max(254);
  return candidates.map((value) => value?.trim().toLowerCase() ?? "").find((value) => email.safeParse(value).success) ?? null;
}

async function accessibleSale(tx: Prisma.TransactionClient, saleId: string, session: Session) {
  const collection = await getSaleCollection(saleId, session, tx);
  if (!collection) throw new PaymentRequestError("La venta no está disponible.", 404);
  const sale = await tx.sale.findUniqueOrThrow({
    where: { id: saleId },
    select: { agencyId: true, contactSnapshot: true, contact: { select: { email: true } }, client: { select: { email: true } } },
  });
  if (sale.agencyId !== SMARTPRO_AGENCY_ID) throw new PaymentRequestError("Los enlaces de abono están disponibles para ventas de SmartPro.", 409);
  return { collection, recipient: recipientEmail(sale.contact?.email, parseContactSnapshot(sale.contactSnapshot)?.email, sale.client.email) };
}

export async function listPaymentRequests(saleId: string, session: Session) {
  const db = database();
  const { recipient } = await accessibleSale(db, saleId, session);
  const rows = await db.salePaymentRequest.findMany({ where: { saleId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }] });
  return { requests: rows.map(summary), recipient };
}

async function emailPaymentRequest(row: SalePaymentRequest, saleNumber: string, dispatchKey: string) {
  if (!row.recipient) return { request: summary(row), emailError: "El cliente no tiene un correo registrado. Puedes copiar el enlace." };
  const appUrl = getAppUrl();
  const subject = `Solicitud de abono · Venta ${saleNumber}`;
  const email = renderCorporateEmail({
    appUrl, title: subject, heading: "Abono pendiente", greeting: "Hola,",
    intro: `Puedes pagar el abono acordado para la venta ${saleNumber} desde este enlace.`,
    highlight: { label: "Monto del abono", value: formatCurrency(Number(row.amount)) },
    cta: { label: "Pagar abono", href: appUrl + paymentRequestPath(row.id) },
    closing: "Gracias,", signature: "SmartPro",
  });
  const result = await sendEmail({ to: row.recipient, subject, ...email, idempotencyKey: `sale-deposit/${row.id}/${dispatchKey}` });
  if (!result.delivered) {
    return { request: summary(row), emailError: result.uncertain
      ? "El proveedor aún no confirma el envío. El enlace está disponible en el historial."
      : "No se pudo enviar el correo. Puedes copiar el enlace o reintentar el envío." };
  }
  const updated = await database().salePaymentRequest.update({ where: { id: row.id }, data: { emailAcceptedAt: new Date() } });
  return { request: summary(updated), emailError: null };
}

export async function createPaymentRequest(saleId: string, session: Session, input: { amount: string; key: string }) {
  const db = database();
  const { row, saleNumber } = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM Sale WHERE id = ${saleId} FOR UPDATE`;
    const { collection, recipient } = await accessibleSale(tx, saleId, session);
    const existing = await tx.salePaymentRequest.findUnique({ where: { requestKey: input.key } });
    if (existing) {
      if (existing.saleId !== saleId || Number(existing.amount) !== parseAmount(input.amount, Number(existing.amount))) {
        throw new PaymentRequestError("La solicitud ya se usó con otros datos.", 409);
      }
      return { row: existing, saleNumber: collection.saleNumber };
    }
    const amount = parseAmount(input.amount, collection.balanceDue);
    if (await tx.salePaymentRequest.findFirst({ where: { saleId, status: "PENDING" }, select: { id: true } })) {
      throw new PaymentRequestError("Ya hay un enlace pendiente. Cópialo o cancélalo antes de crear otro.", 409);
    }
    const row = await tx.salePaymentRequest.create({ data: {
      id: randomBytes(32).toString("hex"), requestKey: input.key, saleId, amount, recipient, createdByEmail: session.email,
    } });
    return { row, saleNumber: collection.saleNumber };
  });
  if (row.status !== "PENDING" || row.emailAcceptedAt) return { request: summary(row), emailError: null };
  return emailPaymentRequest(row, saleNumber, "initial");
}

function parseAmount(raw: string, balance: number) {
  try {
    const amount = parseSalePaymentAmount(raw, balance);
    if (amount < 1) throw new Error("El abono debe ser mayor a $0.");
    return amount;
  } catch (error) {
    throw new PaymentRequestError(error instanceof Error ? error.message : "Revisa el monto.");
  }
}

export async function changePaymentRequest(
  saleId: string, session: Session, input: { id: string; action: "cancel" | "resend"; key?: string },
) {
  const { row, saleNumber, dispatchKey } = await database().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM Sale WHERE id = ${saleId} FOR UPDATE`;
    const { collection, recipient } = await accessibleSale(tx, saleId, session);
    const row = await tx.salePaymentRequest.findFirst({ where: { id: input.id, saleId } });
    if (!row) throw new PaymentRequestError("No se encontró la solicitud.", 404);
    if (row.status !== "PENDING") throw new PaymentRequestError("La solicitud ya no está pendiente.", 409);
    if (input.action === "cancel") {
      if (row.webpayToken) throw new PaymentRequestError("Hay un pago en curso. Espera la confirmación de Webpay.", 409);
      const updated = await tx.salePaymentRequest.update({ where: { id: row.id }, data: { status: "CANCELLED" } });
      return { row: updated, saleNumber: collection.saleNumber };
    }
    if (Number(row.amount) > collection.balanceDue && !row.webpayToken) {
      throw new PaymentRequestError("El saldo cambió. Cancela esta solicitud y crea una por el monto actualizado.", 409);
    }
    return {
      row: !row.recipient && recipient ? await tx.salePaymentRequest.update({ where: { id: row.id }, data: { recipient } }) : row,
      saleNumber: collection.saleNumber,
      dispatchKey: row.emailAcceptedAt ? input.key : "initial",
    };
  });
  return dispatchKey ? emailPaymentRequest(row, saleNumber, dispatchKey) : { request: summary(row), emailError: null };
}

const payableSaleSelect = {
  agencyId: true, total: true, number: true, clientId: true, status: true, archivedAt: true,
  business: { select: { deletedAt: true } },
  client: { select: { companyName: true, deletedAt: true, business: { select: { deletedAt: true } } } },
  payments: { select: { amount: true } },
} as const satisfies Prisma.SaleSelect;

type PayableSale = Prisma.SaleGetPayload<{ select: typeof payableSaleSelect }>;

function canPay(sale: PayableSale, amount: number) {
  return sale.agencyId === SMARTPRO_AGENCY_ID && sale.status !== "CANCELLED" && !sale.archivedAt && !sale.client.deletedAt &&
    !(sale.business ?? sale.client.business)?.deletedAt &&
    amount <= getBalanceDue(Number(sale.total), sumPaidAmount(sale.payments.map(({ amount }) => ({ amount: Number(amount) }))));
}

export async function getPublicPaymentRequest(id: string) {
  if (!validPaymentRequestToken(id)) return null;
  const row = await database().salePaymentRequest.findUnique({ where: { id }, include: { sale: { select: payableSaleSelect } } });
  if (!row) return null;
  const amount = Number(row.amount);
  return { amount, saleNumber: row.sale.number, status: requestStatus(row), payable: row.status === "PENDING" && (Boolean(row.webpayToken) || canPay(row.sale, amount)) };
}

function webpaySession(id: string) {
  return `abono-${id.slice(0, 48)}`;
}

function matchesAttempt(row: SalePaymentRequest, snapshot: WebpayCommitSnapshot) {
  return row.webpayToken === snapshot.token && row.webpayOrder === snapshot.buy_order &&
    webpaySession(row.id) === snapshot.session_id && Number(row.amount) === snapshot.amount;
}

async function settlePaymentRequest(row: SalePaymentRequest, snapshot: WebpayCommitSnapshot) {
  if (!matchesAttempt(row, snapshot)) return "unknown";
  const approved = isWebpayApproved(snapshot);
  const failed = snapshot.status === "FAILED" || snapshot.status === "REVERSED";
  if (!approved && !failed) return snapshot.status === "INITIALIZED" ? "initialized" : "unknown";

  const result = await database().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM Sale WHERE id = ${row.saleId} FOR UPDATE`;
    const current = await tx.salePaymentRequest.findUniqueOrThrow({ where: { id: row.id }, include: { sale: { select: payableSaleSelect } } });
    if (current.status === "PAID") return { outcome: "paid" as const };
    if (current.status !== "PENDING" || !matchesAttempt(current, snapshot)) return { outcome: "unknown" as const };
    if (failed) {
      await tx.salePaymentRequest.update({ where: { id: row.id }, data: { webpayToken: null, webpayOrder: null, webpayUrl: null } });
      return { outcome: "failed" as const };
    }

    const amount = Number(row.amount);
    const payment = await tx.salePayment.create({ data: {
      saleId: row.saleId, amount, method: "transbank", source: "ORDER_PAID", createdByEmail: current.createdByEmail,
      observation: "Abono confirmado por Webpay mediante enlace.",
    } });
    await tx.sale.update({ where: { id: row.saleId }, data: { paymentMethod: "transbank" } });
    await tx.salePaymentRequest.update({ where: { id: row.id }, data: { status: "PAID", paymentId: payment.id } });
    return { outcome: "paid" as const, notification: {
      id: payment.id, saleId: row.saleId, saleNumber: current.sale.number, clientId: current.sale.clientId,
      clientCompany: current.sale.client.companyName, amount,
    } };
  });
  if (result.notification) await notifyPaymentReceived(result.notification).catch(() => console.error("[smartpro:abono] No se pudo notificar el abono confirmado."));
  return result.outcome;
}

async function readWebpayAttempt(row: SalePaymentRequest, gateway: Gateway, commit: boolean) {
  const token = row.webpayToken!;
  let response;
  try {
    response = commit ? await gateway.commit(token) : await gateway.status(token);
  } catch {
    if (!commit) return "unknown";
    try { response = await gateway.status(token); } catch { return "unknown"; }
  }
  return settlePaymentRequest(row, toWebpayCommitSnapshot(token, response));
}

export async function refreshPaymentRequest(saleId: string, session: Session, id: string) {
  const db = database();
  await accessibleSale(db, saleId, session);
  const row = await db.salePaymentRequest.findFirst({ where: { id, saleId } });
  if (!row) throw new PaymentRequestError("No se encontró la solicitud.", 404);
  if (row.status === "PENDING" && row.webpayToken) await readWebpayAttempt(row, getWebpayTransaction(), false);
  const updated = await db.salePaymentRequest.findUniqueOrThrow({ where: { id } });
  return { request: summary(updated) };
}

export async function startPaymentRequest(id: string, gateway: Gateway = getWebpayTransaction()) {
  const db = database();
  const prior = validPaymentRequestToken(id) ? await db.salePaymentRequest.findUnique({ where: { id } }) : null;
  if (!prior) throw new PaymentRequestError("El enlace de abono no está disponible.", 404);
  if (prior.status === "PAID") return { status: "paid" as const };
  if (prior.webpayToken && prior.status === "PENDING") {
    const outcome = await readWebpayAttempt(prior, gateway, false);
    if (outcome === "paid") return { status: "paid" as const };
    if (outcome === "unknown") throw new PaymentRequestError("Estamos esperando la confirmación de Webpay. Intenta consultar de nuevo en unos minutos.", 409);
  }

  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM Sale WHERE id = ${prior.saleId} FOR UPDATE`;
    const row = await tx.salePaymentRequest.findUniqueOrThrow({ where: { id }, include: { sale: { select: payableSaleSelect } } });
    if (row.status === "PAID") return { status: "paid" as const };
    if (row.status !== "PENDING") throw new PaymentRequestError("El enlace ya no está disponible para pago.", 409);
    if (row.webpayToken && row.webpayUrl && isAllowedWebpayRedirectUrl(row.webpayUrl)) {
      return { status: "checkout" as const, token: row.webpayToken, url: row.webpayUrl };
    }
    const amount = Number(row.amount);
    if (!canPay(row.sale, amount)) {
      throw new PaymentRequestError("El saldo de la venta cambió. Solicita un enlace actualizado a SmartPro.", 409);
    }

    const buyOrder = `SP-A${randomBytes(10).toString("hex")}`;
    const { token, url } = await gateway.create(buyOrder, webpaySession(id), amount, `${getAppUrl()}/api/abonos/${id}/retorno`);
    if (!token || !isAllowedWebpayRedirectUrl(url)) throw new Error("Webpay no devolvió un enlace válido.");
    await tx.salePaymentRequest.update({ where: { id }, data: { webpayToken: token, webpayOrder: buyOrder, webpayUrl: url } });
    return { status: "checkout" as const, token, url };
  }, { timeout: 25_000 });
}

export async function confirmPaymentRequest(id: string, returned: ClassifiedWebpayReturn, gateway: Gateway = getWebpayTransaction()) {
  if (!validPaymentRequestToken(id)) return;
  const row = await database().salePaymentRequest.findUnique({ where: { id } });
  if (!row || row.status !== "PENDING" || !row.webpayToken) return;
  if (returned.token === row.webpayToken && returned.kind === "commit") return readWebpayAttempt(row, gateway, true);
  if ((returned.kind === "aborted" && returned.token === row.webpayToken) ||
      (returned.kind === "timeout" && returned.buyOrder === row.webpayOrder && returned.sessionId === webpaySession(id))) {
    return readWebpayAttempt(row, gateway, false);
  }
}
