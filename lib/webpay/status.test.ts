import test from "node:test";
import assert from "node:assert/strict";

import {
  amountsMatch,
  checkoutResultFromWebpayKind,
  isWebpayApproved,
  toWebpayAmount,
  toWebpayCommitSnapshot,
} from "./status";

test("aprueba solo si response_code es 0 y status es AUTHORIZED", () => {
  assert.equal(isWebpayApproved({ response_code: 0, status: "AUTHORIZED" }), true);
  assert.equal(isWebpayApproved({ response_code: 0, status: "FAILED" }), false);
  assert.equal(isWebpayApproved({ response_code: -1, status: "AUTHORIZED" }), false);
  assert.equal(isWebpayApproved({ status: "AUTHORIZED" }), false);
});

test("el monto de Webpay es entero CLP y debe coincidir con la orden", () => {
  assert.equal(toWebpayAmount(119000.4), 119000);
  assert.equal(amountsMatch(119000.2, 119000), true);
  assert.equal(amountsMatch(119000, 1), false);
  assert.equal(amountsMatch(119000, undefined), false);
  assert.throws(() => toWebpayAmount(0), /monto/);
});

test("normaliza commit snake_case o camelCase y no usa datos de tarjeta", () => {
  const snapshot = toWebpayCommitSnapshot("tok-1", {
    buy_order: "SP-2026-1",
    sessionId: "SP-2026-1-session",
    amount: "119000",
    status: "AUTHORIZED",
    responseCode: 0,
    card_detail: { card_number: "6623" },
  });

  assert.equal(snapshot.buy_order, "SP-2026-1");
  assert.equal(snapshot.session_id, "SP-2026-1-session");
  assert.equal(snapshot.amount, 119000);
  assert.equal(snapshot.response_code, 0);
  assert.equal("card_detail" in snapshot, false);
});

test("traduce el retorno de Webpay a la pantalla de resultado", () => {
  assert.equal(checkoutResultFromWebpayKind("commit", true), "approved");
  assert.equal(checkoutResultFromWebpayKind("commit", false), "failed");
  assert.equal(checkoutResultFromWebpayKind("aborted", false), "cancelled");
  assert.equal(checkoutResultFromWebpayKind("timeout", false), "cancelled");
  assert.equal(checkoutResultFromWebpayKind("error", false), "failed");
});
