import test from "node:test";
import assert from "node:assert/strict";

import { buildOrderTotals, type CartItemDraft } from "./service";

test("buildOrderTotals recalcula subtotal, IVA y total sin confiar en valores enviados", () => {
  const items: CartItemDraft[] = [
    { id: "test-plan", name: "Plan Pro", category: "desarrolloWeb", quantity: 2, unitPrice: 299000 },
  ];

  const totals = buildOrderTotals(items);

  assert.equal(totals.subtotal, 598000);
  assert.equal(totals.tax, 113620);
  assert.equal(totals.total, 711620);
});
