import test from "node:test";
import assert from "node:assert/strict";

import { canTransitionPaymentStatus, checkoutResultStatus, mapMercadoPagoStatus } from "./status";

test("mapea estados de Mercado Pago a SmartPro", () => {
  assert.deepEqual(mapMercadoPagoStatus("approved"), { paymentStatus: "paid", orderStatus: "confirmed" });
  assert.deepEqual(mapMercadoPagoStatus("rejected"), { paymentStatus: "failed", orderStatus: "cancelled" });
  assert.deepEqual(mapMercadoPagoStatus("pending"), { paymentStatus: "pending", orderStatus: "pending" });
  assert.deepEqual(mapMercadoPagoStatus("in_process"), { paymentStatus: "pending", orderStatus: "pending" });
  assert.deepEqual(mapMercadoPagoStatus("cancelled"), { paymentStatus: "cancelled", orderStatus: "cancelled" });
  assert.deepEqual(mapMercadoPagoStatus("refunded"), { paymentStatus: "cancelled", orderStatus: "cancelled" });
});

test("no degrada un pago aprobado hacia fallido", () => {
  assert.equal(canTransitionPaymentStatus("paid", "failed"), false);
  assert.equal(canTransitionPaymentStatus("paid", "pending"), false);
  assert.equal(canTransitionPaymentStatus("paid", "cancelled"), true);
  assert.equal(canTransitionPaymentStatus("pending", "paid"), true);
});

test("traduce el estado interno a la pantalla de resultado", () => {
  assert.equal(checkoutResultStatus("paid"), "approved");
  assert.equal(checkoutResultStatus("pending"), "pending");
  assert.equal(checkoutResultStatus("failed"), "failed");
  assert.equal(checkoutResultStatus("cancelled"), "cancelled");
});
