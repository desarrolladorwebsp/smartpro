export function normalizeRut(value: string): string {
  const digits = value.replace(/[^0-9kK]/g, "");

  if (!digits) {
    return "";
  }

  const body = digits.slice(0, -1);
  const verifier = digits.slice(-1).toUpperCase();

  if (!body || !verifier) {
    return "";
  }

  return `${body}-${verifier}`;
}

export function isValidRut(value: string): boolean {
  const normalized = normalizeRut(value).replace(/\s+/g, "");

  if (!/^\d{7,8}-?[0-9Kk]$/.test(normalized)) {
    return false;
  }

  const digits = normalized.replace("-", "");
  const body = digits.slice(0, -1);
  const verifier = digits.slice(-1).toUpperCase();
  const factors = [3, 2, 7, 6, 5, 4, 3, 2];

  let sum = 0;

  for (let index = body.length - 1, factorIndex = 0; index >= 0; index -= 1, factorIndex += 1) {
    sum += Number(body[index]) * factors[factorIndex % factors.length];
  }

  const expected = 11 - (sum % 11);
  const checkDigit = expected === 11 ? "0" : expected === 10 ? "K" : String(expected);

  return checkDigit === verifier;
}
