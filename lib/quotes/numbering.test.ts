import test from "node:test";
import assert from "node:assert/strict";

import { nextQuoteNumber } from "./numbering";

test("nextQuoteNumber inicia la serie anual cuando no hay cotizaciones previas", () => {
  const now = new Date("2026-03-10T12:00:00");
  assert.equal(nextQuoteNumber(null, now), "COT-2026-0001");
  assert.equal(nextQuoteNumber("COT-2025-0099", now), "COT-2026-0001");
});

test("nextQuoteNumber incrementa el correlativo del mismo año", () => {
  const now = new Date("2026-09-09T12:00:00");
  assert.equal(nextQuoteNumber("COT-2026-0001", now), "COT-2026-0002");
  assert.equal(nextQuoteNumber("COT-2026-0099", now), "COT-2026-0100");
});
