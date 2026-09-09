import test from "node:test";
import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import path from "node:path";

import { createOrderRecord, getOrderRecord } from "../orders/repository";
import { applyMercadoPagoPayment } from "./sync";

async function withOrdersFile(run: () => Promise<void>) {
  const fileName = `orders-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`;
  const previous = process.env.ORDERS_FILE;
  process.env.ORDERS_FILE = fileName;
  const fullPath = path.join(process.cwd(), "data", fileName);

  try {
    await run();
  } finally {
    if (previous === undefined) {
      delete process.env.ORDERS_FILE;
    } else {
      process.env.ORDERS_FILE = previous;
    }
    await rm(fullPath, { force: true });
  }
}

async function createPendingOrder() {
  return createOrderRecord({
    customer: {
      name: "Ana García",
      email: "ana@smartpro.cl",
      phone: "+56912345678",
      company: "SmartPro Studio",
    },
    items: [{ id: "plan-pro", name: "Plan Pro", category: "desarrolloWeb", quantity: 1, unitPrice: 100000 }],
    subtotal: 100000,
    tax: 19000,
    total: 119000,
    paymentStatus: "pending",
    paymentMethod: "mercadopago",
  });
}

test("marca pagada una orden aprobada y envía correo una sola vez", async () => {
  await withOrdersFile(async () => {
    const order = await createPendingOrder();
    let emails = 0;

    const sendEmail = async () => {
      emails += 1;
      return { delivered: true, provider: "resend" as const };
    };

    const first = await applyMercadoPagoPayment(
      {
        id: "pay-1",
        status: "approved",
        external_reference: order.id,
        transaction_amount: 119000,
      },
      sendEmail,
    );

    assert.equal(first.duplicate, false);
    assert.equal(first.emailSent, true);
    assert.equal(first.order?.paymentStatus, "paid");
    assert.equal(first.order?.paymentMethod, "mercadopago");
    assert.equal(first.order?.orderStatus, "confirmed");

    const second = await applyMercadoPagoPayment(
      {
        id: "pay-1",
        status: "approved",
        external_reference: order.id,
        transaction_amount: 119000,
      },
      sendEmail,
    );

    assert.equal(second.duplicate, true);
    assert.equal(second.emailSent, false);
    assert.equal(emails, 1);

    const stored = await getOrderRecord(order.id);
    assert.equal(stored?.paymentStatus, "paid");
    assert.ok(stored?.notificationEmailSentAt);
  });
});

test("mantiene pendiente, failed y cancelled según Mercado Pago", async () => {
  await withOrdersFile(async () => {
    const pendingOrder = await createPendingOrder();
    const pending = await applyMercadoPagoPayment({
      id: "pay-pending",
      status: "pending",
      external_reference: pendingOrder.id,
      transaction_amount: 119000,
    });
    assert.equal(pending.order?.paymentStatus, "pending");

    const rejectedOrder = await createPendingOrder();
    const rejected = await applyMercadoPagoPayment({
      id: "pay-rejected",
      status: "rejected",
      external_reference: rejectedOrder.id,
      transaction_amount: 119000,
    });
    assert.equal(rejected.order?.paymentStatus, "failed");

    const cancelledOrder = await createPendingOrder();
    const cancelled = await applyMercadoPagoPayment({
      id: "pay-cancelled",
      status: "cancelled",
      external_reference: cancelledOrder.id,
      transaction_amount: 119000,
    });
    assert.equal(cancelled.order?.paymentStatus, "cancelled");
  });
});

test("no marca pagada si el monto no coincide", async () => {
  await withOrdersFile(async () => {
    const order = await createPendingOrder();

    await assert.rejects(
      () =>
        applyMercadoPagoPayment({
          id: "pay-mismatch",
          status: "approved",
          external_reference: order.id,
          transaction_amount: 1,
        }),
      /no coincide/,
    );

    const stored = await getOrderRecord(order.id);
    assert.equal(stored?.paymentStatus, "pending");
  });
});

test("no degrada una orden pagada si llega un rechazo posterior", async () => {
  await withOrdersFile(async () => {
    const order = await createPendingOrder();

    await applyMercadoPagoPayment({
      id: "pay-1",
      status: "approved",
      external_reference: order.id,
      transaction_amount: 119000,
    });

    const rejected = await applyMercadoPagoPayment({
      id: "pay-1",
      status: "rejected",
      external_reference: order.id,
      transaction_amount: 119000,
    });

    assert.equal(rejected.order?.paymentStatus, "paid");
  });
});
