import type { ClientAcquisitionOrigin } from "@prisma/client";

export const CLIENT_ACQUISITION_ORIGINS = {
  CAMPAIGN_WEB: "Campaña web",
  REFERRAL: "Referido",
  SENDPULSE: "SendPulse +56 9 2250 7731",
} satisfies Record<ClientAcquisitionOrigin, string>;

export function parseClientAcquisitionOrigin(value: unknown): ClientAcquisitionOrigin | null | undefined {
  if (value === undefined) return undefined;
  if (value === "" || value === null) return null;
  if (typeof value === "string" && Object.hasOwn(CLIENT_ACQUISITION_ORIGINS, value)) {
    return value as ClientAcquisitionOrigin;
  }
  throw new Error("Selecciona un origen válido o deja el campo vacío.");
}
