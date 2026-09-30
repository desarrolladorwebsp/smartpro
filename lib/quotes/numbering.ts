import { randomInt } from "node:crypto";

const PREFIX = "COT";

export const QUOTE_NUMBER_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const SUFFIX_LENGTH = 4;

function randomAlphabetIndex(max: number): number {
  return randomInt(max);
}

export function createQuoteNumber(now = new Date(), randomIndex: (max: number) => number = randomAlphabetIndex): string {
  const year = now.getFullYear();
  let suffix = "";

  for (let index = 0; index < SUFFIX_LENGTH; index += 1) {
    const position = randomIndex(QUOTE_NUMBER_ALPHABET.length);
    suffix += QUOTE_NUMBER_ALPHABET[position] ?? QUOTE_NUMBER_ALPHABET[0];
  }

  return `${PREFIX}-${year}-${suffix}`;
}
