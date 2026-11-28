import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

const testDatabase = process.env.SMARTPRO_ABONOS_TEST_DATABASE;

test("solicita, comparte y confirma un abono una sola vez", { skip: !testDatabase }, async (t) => {
  const url = new URL(testDatabase!);
  assert.equal(url.protocol, "mysql:");
  assert.equal(url.hostname, "127.0.0.1");
  assert.equal(url.pathname, "/smartpro_abonos_qa");
  assert.equal(process.env.DATABASE_URL, testDatabase);
  assert.ok(!process.env.DB_HOST && !process.env.DB_CONNECTION_URL);
  process.env.APP_URL = "https://smartpro.example";
  process.env.RESEND_API_KEY = "test-only";

  const emails = new Map<string, { to: string[]; subject: string; text: string }>();
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(String(input), "https://api.resend.com/emails");
    const key = new Headers(init?.headers).get("Idempotency-Key");
    assert.ok(key);
    emails.set(key, JSON.parse(String(init?.body)));
    return Response.json({ id: "qa-email" });
  });

  const { prisma: db } = await import("../db");
  const { changePaymentRequest, confirmPaymentRequest, createPaymentRequest, getPublicPaymentRequest, listPaymentRequests, startPaymentRequest } = await import("./payment-requests");
  const { addSalePayment } = await import("./repository");
  assert.ok(db);
  const client = await db.client.create({ data: { companyName: "QA abonos", contactFirstName: "QA", contactLastName: "Abono", email: "qa-abonos@example.invalid" } });
  const admin = { role: "ADMIN" as const, email: "admin-qa@example.invalid" };
  const sale = await db.sale.create({ data: { number: `QA-${randomUUID()}`, clientId: client.id, createdByEmail: admin.email, subtotal: 100000, tax: 19000, total: 119000 } });
  t.after(async () => {
    await db.salePaymentRequest.deleteMany({ where: { saleId: sale.id } });
    await db.sale.delete({ where: { id: sale.id } });
    await db.client.delete({ where: { id: client.id } });
    await db.$disconnect();
  });

  await assert.rejects(listPaymentRequests(sale.id, { role: "EXECUTIVE", email: "otro@example.invalid" }), /no está disponible/);
  await assert.rejects(createPaymentRequest(sale.id, admin, { key: randomUUID(), amount: "120.000" }), /superar el saldo/);
  const input = { key: randomUUID(), amount: "40.000" };
  const { request } = await createPaymentRequest(sale.id, admin, input);
  assert.equal(request.amount, 40000);
  assert.ok(request.emailAcceptedAt);
  assert.deepEqual((await createPaymentRequest(sale.id, admin, input)).request, request);
  assert.equal(emails.size, 1);
  const sent = [...emails.values()][0];
  assert.deepEqual(sent.to, ["qa-abonos@example.invalid"]);
  assert.ok(sent.text.includes(request.url));
  assert.equal((await listPaymentRequests(sale.id, admin)).requests[0].url, request.url);

  type Gateway = NonNullable<Parameters<typeof startPaymentRequest>[1]>;
  let creates = 0;
  let buyOrder: string;
  let sessionId: string;
  let gatewayAmount: number;
  let confirmation: "INITIALIZED" | "FAILED" | "AUTHORIZED" = "INITIALIZED";
  let responseAmount = 40000;
  function snapshot() {
    return { buy_order: buyOrder, session_id: sessionId, amount: responseAmount, status: confirmation, response_code: confirmation === "AUTHORIZED" ? 0 : -1 };
  }
  const gateway = {
    async create(order: string, session: string, amount: number, returnUrl: string) {
      creates += 1;
      buyOrder = order;
      sessionId = session;
      gatewayAmount = amount;
      assert.equal(returnUrl, `https://smartpro.example/api/abonos/${request.id}/retorno`);
      return { token: `qa-token-${creates}`, url: "https://webpay3gint.transbank.cl/webpayserver/initTransaction" };
    },
    async status() { return snapshot(); },
    async commit() { return snapshot(); },
  } as unknown as Gateway;

  const [left, right] = await Promise.all([startPaymentRequest(request.id, gateway), startPaymentRequest(request.id, gateway)]);
  assert.equal(creates, 1);
  assert.equal(gatewayAmount!, 40000);
  assert.deepEqual(left, right);
  assert.equal(left.status, "checkout");
  if (left.status !== "checkout") assert.fail("Falta la transacción de Webpay.");
  await assert.rejects(addSalePayment(sale.id, { amount: 1, method: "cash", createdByEmail: admin.email }), /pago en curso/);
  await assert.rejects(changePaymentRequest(sale.id, admin, { action: "cancel", id: request.id }), /pago en curso/);

  const returned = { kind: "commit" as const, token: left.token, buyOrder: "", sessionId: "" };
  confirmation = "AUTHORIZED";
  responseAmount = 41000;
  assert.equal(await confirmPaymentRequest(request.id, returned, gateway), "unknown");
  assert.equal(await db.salePayment.count({ where: { saleId: sale.id } }), 0);
  responseAmount = 40000;
  await Promise.all([confirmPaymentRequest(request.id, returned, gateway), confirmPaymentRequest(request.id, returned, gateway)]);
  assert.deepEqual(await startPaymentRequest(request.id, gateway), { status: "paid" });
  assert.equal(creates, 1);
  const payments = await db.salePayment.findMany({ where: { saleId: sale.id } });
  assert.equal(payments.length, 1);
  assert.equal(Number(payments[0].amount), 40000);
  assert.equal((await getPublicPaymentRequest(request.id))?.payable, false);
  assert.equal((await listPaymentRequests(sale.id, admin)).requests[0].status, "PAID");

  const next = await createPaymentRequest(sale.id, admin, { key: randomUUID(), amount: "79.000" });
  await changePaymentRequest(sale.id, admin, { action: "cancel", id: next.request.id });
  assert.equal((await getPublicPaymentRequest(next.request.id))?.payable, false);
  await assert.rejects(startPaymentRequest(next.request.id, gateway), /ya no está disponible/);
});
