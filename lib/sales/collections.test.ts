import assert from "node:assert/strict";
import test from "node:test";

import { allocateCollectionDues, buildCollectionPreview, collectionInstallmentAmounts } from "./collections";

test("mantiene el día de pago acordado al pasar por un mes corto", () => {
  const plan = buildCollectionPreview("2028-01-31", [100, 120, 150, 180], 0, "2028-01-31");
  assert.deepEqual(plan.map(({ dueOn }) => dueOn), ["2028-01-31", "2028-02-29", "2028-03-31", "2028-04-30"]);
  assert.deepEqual(plan.map(({ status }) => status), ["DUE", "UPCOMING", "UPCOMING", "UPCOMING"]);
  assert.throws(() => buildCollectionPreview("2026-02-30", [100], 0), /fecha válida/);
  assert.throws(() => buildCollectionPreview("9999-12-10", [100, 100], 0), /último vencimiento/);
});

test("combina cuotas fijas y variables de la cotización con el pago único", () => {
  const proposal = { payments: [
    { mode: "ONE_TIME", amounts: [50] },
    { mode: "INSTALLMENTS", amounts: [100, 100, 100] },
    { mode: "INSTALLMENTS", amounts: [40, 60] },
  ] };
  assert.deepEqual(collectionInstallmentAmounts(proposal, 450), [190, 160, 100]);
  assert.deepEqual(collectionInstallmentAmounts(proposal, 449), []);
  assert.deepEqual(collectionInstallmentAmounts({ payments: [...proposal.payments, { mode: "RENEWABLE", amounts: [100] }] }, 550), []);
  assert.deepEqual(collectionInstallmentAmounts({ payments: [{ mode: "INSTALLMENTS", amounts: ["10", null] }] }, 10), []);
});

test("recalcula saldos tras guardar o corregir abonos y el más antiguo se cubre primero", () => {
  const schedule = [
    { id: "feb", sequence: 2, dueOn: "2027-02-01", amount: 150_000 },
    { id: "jan", sequence: 1, dueOn: "2027-01-01", amount: 100_000 },
  ];
  const now = "2027-02-01";
  const partial = allocateCollectionDues(schedule, 140_000, now);
  assert.deepEqual(partial.map(({ id, status, remaining }) => [id, status, remaining]), [
    ["jan", "PAID", 0], ["feb", "DUE", 110_000],
  ]);
  const corrected = allocateCollectionDues(schedule, 40_000, now);
  assert.deepEqual(corrected.map(({ status, remaining }) => [status, remaining]), [["OVERDUE", 60_000], ["DUE", 150_000]]);
  assert.equal(allocateCollectionDues(schedule, 250_000, now).every(({ status }) => status === "PAID"), true);
});
