import test from "node:test";
import assert from "node:assert/strict";

import { parseQuoteValidUntil } from "./dates";

test("parseQuoteValidUntil interpreta YYYY-MM-DD en hora local de cierre", () => {
  const date = parseQuoteValidUntil("2026-09-20");
  assert.equal(date.getFullYear(), 2026);
  assert.equal(date.getMonth(), 8);
  assert.equal(date.getDate(), 20);
  assert.equal(date.getHours(), 23);
});

test("parseQuoteValidUntil rechaza fechas inválidas", () => {
  assert.throws(() => parseQuoteValidUntil("no-es-fecha"), /vencimiento/);
});
