import test from "node:test";
import assert from "node:assert/strict";

import { QUOTE_NUMBER_ALPHABET, createQuoteNumber } from "./numbering";

test("createQuoteNumber arma COT-año y cuatro caracteres al azar", () => {
  const now = new Date("2026-09-30T12:00:00");
  const positions = [0, 10, 20, 31];
  let cursor = 0;
  const number = createQuoteNumber(now, () => positions[cursor++] ?? 0);

  assert.equal(
    number,
    `COT-2026-${QUOTE_NUMBER_ALPHABET[0]}${QUOTE_NUMBER_ALPHABET[10]}${QUOTE_NUMBER_ALPHABET[20]}${QUOTE_NUMBER_ALPHABET[31]}`,
  );
  assert.match(number, /^COT-2026-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/);
});

test("createQuoteNumber no continúa el correlativo anterior", () => {
  const now = new Date("2026-09-30T12:00:00");
  const number = createQuoteNumber(now, () => 3);

  assert.notEqual(number, "COT-2026-0002");
  assert.equal(number.slice(-4), QUOTE_NUMBER_ALPHABET[3]!.repeat(4));
});
