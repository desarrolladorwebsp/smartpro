export const CLIENT_SERVICE_INTERESTS = {
  ADVERTISING: "Campañas publicitarias",
  WEB_DEVELOPMENT: "Desarrollo web",
  PODCAST: "Podcast",
} as const;

export type ClientServiceInterest = keyof typeof CLIENT_SERVICE_INTERESTS;
export const CLIENT_SERVICE_INTEREST_KEYS = Object.keys(CLIENT_SERVICE_INTERESTS) as ClientServiceInterest[];

export function parseClientServiceInterests(value: unknown): ClientServiceInterest[] | null {
  if (!Array.isArray(value) || value.some((key) => typeof key !== "string" || !Object.hasOwn(CLIENT_SERVICE_INTERESTS, key))) return null;
  return CLIENT_SERVICE_INTEREST_KEYS.filter((key) => value.includes(key));
}

export function clientServiceInterestFromName(value: string): ClientServiceInterest | undefined {
  const name = value.normalize("NFD").replace(/\p{M}/gu, "").trim().replace(/\s+/g, " ").toLowerCase();
  if (name === "campanas publicitarias" || name === "campana publicitaria") return "ADVERTISING";
  if (name === "desarrollo web") return "WEB_DEVELOPMENT";
  if (name === "podcast") return "PODCAST";
}
