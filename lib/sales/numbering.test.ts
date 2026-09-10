import test from "node:test";
import assert from "node:assert/strict";

import { nextSaleNumber } from "./numbering";

test("nextSaleNumber inicia la serie anual cuando no hay ventas previas", () => {
  const now = new Date("2026-03-10T12:00:00");
  assert.equal(nextSaleNumber(null, now), "VEN-2026-0001");
  assert.equal(nextSaleNumber("VEN-2025-0099", now), "VEN-2026-0001");
});

test("nextSaleNumber incrementa el correlativo del mismo año", () => {
  const now = new Date("2026-09-10T12:00:00");
  assert.equal(nextSaleNumber("VEN-2026-0001", now), "VEN-2026-0002");
  assert.equal(nextSaleNumber("VEN-2026-0099", now), "VEN-2026-0100");
});
