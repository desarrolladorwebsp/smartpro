import test from "node:test";
import assert from "node:assert/strict";

import { getPrismaClient } from "../db";
import { createOrderRecord, deleteOrderRecord, getOrderRecord } from "../orders/repository";
import { applyWebpayCommit, applyWebpayInterrupted } from "./sync";

const createdOrderIds: string[] = [];

test.afterEach(async () => {
  while (createdOrderIds.length) {
    const orderId = createdOrderIds.pop();
    if (orderId) {
      await deleteOrderRecord(orderId);
    }
  }
});

test.after(async () => {
  await getPrismaClient()?.$disconnect().catch(() => undefined);
});

async function createPendingOrder() {
  const order = await createOrderRecord({
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
    paymentMethod: "transbank",
  });

  createdOrderIds.push(order.id);
  return order;
}

test("marca pagada una orden Webpay autorizada y envía correo una sola vez", async () => {
  const order = await createPendingOrder();
  let emails = 0;

  const sendEmail = async () => {
    emails += 1;
    return { delivered: true, provider: "resend" as const };
  };

  const first = await applyWebpayCommit(
    {
      token: "tok-ok",
      buy_order: order.id,
      amount: 119000,
      status: "AUTHORIZED",
      response_code: 0,
    },
    sendEmail,
  );

  assert.equal(first.duplicate, false);
  assert.equal(first.emailSent, true);
  assert.equal(first.order?.paymentStatus, "paid");
  assert.equal(first.order?.paymentMethod, "transbank");
  assert.equal(first.order?.orderStatus, "confirmed");
  assert.equal(first.order?.webpayToken, "tok-ok");

  const second = await applyWebpayCommit(
    {
      token: "tok-ok",
      buy_order: order.id,
      amount: 119000,
      status: "AUTHORIZED",
      response_code: 0,
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

test("rechazo, aborto y timeout actualizan la orden sin marcarla pagada", async () => {
  const rejectedOrder = await createPendingOrder();
  const rejected = await applyWebpayCommit({
    token: "tok-rejected",
    buy_order: rejectedOrder.id,
    amount: 119000,
    status: "FAILED",
    response_code: -1,
  });
  assert.equal(rejected.order?.paymentStatus, "failed");

  const abortedOrder = await createPendingOrder();
  const aborted = await applyWebpayInterrupted({
    kind: "aborted",
    token: "tok-abort",
    buyOrder: abortedOrder.id,
  });
  assert.equal(aborted.order?.paymentStatus, "cancelled");

  const timeoutOrder = await createPendingOrder();
  const timeout = await applyWebpayInterrupted({
    kind: "timeout",
    buyOrder: timeoutOrder.id,
  });
  assert.equal(timeout.order?.paymentStatus, "cancelled");
});

test("no marca pagada si el monto no coincide", async () => {
  const order = await createPendingOrder();

  await assert.rejects(
    () =>
      applyWebpayCommit({
        token: "tok-mismatch",
        buy_order: order.id,
        amount: 1,
        status: "AUTHORIZED",
        response_code: 0,
      }),
    /no coincide/,
  );

  const stored = await getOrderRecord(order.id);
  assert.equal(stored?.paymentStatus, "pending");
});

test("no degrada una orden pagada si llega un rechazo o aborto posterior", async () => {
  const order = await createPendingOrder();

  await applyWebpayCommit({
    token: "tok-paid",
    buy_order: order.id,
    amount: 119000,
    status: "AUTHORIZED",
    response_code: 0,
  });

  const rejected = await applyWebpayCommit({
    token: "tok-paid",
    buy_order: order.id,
    amount: 119000,
    status: "FAILED",
    response_code: -1,
  });
  assert.equal(rejected.order?.paymentStatus, "paid");

  const aborted = await applyWebpayInterrupted({
    kind: "aborted",
    token: "tok-paid",
    buyOrder: order.id,
  });
  assert.equal(aborted.order?.paymentStatus, "paid");
});
