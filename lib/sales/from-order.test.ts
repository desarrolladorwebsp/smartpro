import test from "node:test";
import assert from "node:assert/strict";

import { buildPaidOrderSaleDraft, isPaidOrderEligible, PaidOrderSaleValidationError } from "./from-order";
import type { CustomerOrder } from "../orders/repository";

function paidOrder(overrides: Partial<CustomerOrder> = {}): CustomerOrder {
  return {
    id: "SP-2026-100001",
    createdAt: "2026-09-14T18:00:00.000Z",
    orderStatus: "confirmed",
    status: "confirmed",
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
    paymentStatus: "paid",
    paymentMethod: "mercadopago",
    ...overrides,
  };
}

test("isPaidOrderEligible solo admite órdenes pagadas", () => {
  assert.equal(isPaidOrderEligible(paidOrder()), true);
  assert.equal(isPaidOrderEligible(paidOrder({ paymentStatus: "pending" })), false);
  assert.equal(isPaidOrderEligible(null), false);
});

test("buildPaidOrderSaleDraft arma una venta válida desde una orden pagada", () => {
  const draft = buildPaidOrderSaleDraft(paidOrder({ quoteId: "quote-1", paymentMethod: "transbank" }));
  assert.equal(draft.orderId, "SP-2026-100001");
  assert.equal(draft.quoteId, "quote-1");
  assert.equal(draft.clientEmail, "ana@smartpro.cl");
  assert.equal(draft.contactFirstName, "Ana");
  assert.equal(draft.contactLastName, "García");
  assert.equal(draft.paymentMethod, "transbank");
  assert.equal(draft.source, "ORDER_PAID");
  assert.equal(draft.total, 119000);
});

test("buildPaidOrderSaleDraft rechaza datos faltantes o tipos incorrectos", () => {
  assert.throws(() => buildPaidOrderSaleDraft(null), PaidOrderSaleValidationError);
  assert.throws(() => buildPaidOrderSaleDraft(paidOrder({ paymentStatus: "pending" })), /orden pagada/);
  assert.throws(() => buildPaidOrderSaleDraft(paidOrder({ id: "" })), /identificador/);
  assert.throws(
    () => buildPaidOrderSaleDraft(paidOrder({ customer: { name: "Ana", email: "no-email", phone: "123" } })),
    /email/,
  );
  assert.throws(
    () => buildPaidOrderSaleDraft(paidOrder({ customer: { name: "", email: "ana@smartpro.cl", phone: "123" } })),
    /nombre/,
  );
  assert.throws(() => buildPaidOrderSaleDraft(paidOrder({ total: -1 })), /negativo/);
  assert.throws(() => buildPaidOrderSaleDraft(paidOrder({ total: Number.NaN })), /número válido/);
  assert.throws(() => buildPaidOrderSaleDraft(paidOrder({ total: 1 })), /no coinciden/);
  assert.throws(
    () => buildPaidOrderSaleDraft(paidOrder({ paymentMethod: "cash" as CustomerOrder["paymentMethod"] })),
    /método de pago/,
  );
  assert.throws(() => buildPaidOrderSaleDraft(paidOrder({ createdAt: "fecha-mala" })), /fecha/);
});
