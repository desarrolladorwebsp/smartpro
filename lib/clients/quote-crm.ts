import type { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { isQuoteExpired } from "../quotes/status";
import type { QuoteStatus } from "../quotes/types";
import { commercialClientId } from "./commercial-clients";
import { recordCrmChange } from "./crm-history";
import type { ClientCrmStage } from "./types";

export type CrmQuoteIndicator = "ACCEPTED" | "CURRENT" | "EXPIRED" | "REJECTED";

type QuoteOwner = { clientId: string; businessId: string | null };
type CrmQuote = QuoteOwner & { status: QuoteStatus; validUntil: Date | null };
type QuoteSummary = { indicator?: CrmQuoteIndicator; hasRejected: boolean; hasOtherFinalized: boolean };

export const crmQuoteFields = { clientId: true, businessId: true, status: true, validUntil: true } as const;

const indicatorPriority: Record<CrmQuoteIndicator, number> = { REJECTED: 1, EXPIRED: 2, CURRENT: 3, ACCEPTED: 4 };
const earlyStages: ClientCrmStage[] = ["NEW", "CONTACTED"];
const stageBeforeNegotiation: ClientCrmStage[] = ["NEW", "CONTACTED", "QUOTED", "PROPOSAL_REJECTED"];

export function summarizeCrmQuotes(quotes: CrmQuote[], now = new Date()) {
  const summaries = new Map<string, QuoteSummary>();

  for (const quote of quotes) {
    if (quote.status === "DRAFT") continue;
    const key = commercialClientId(quote.clientId, quote.businessId);
    const summary = summaries.get(key) ?? { hasRejected: false, hasOtherFinalized: false };
    let indicator: CrmQuoteIndicator;
    if (quote.status === "REJECTED") {
      summary.hasRejected = true;
      indicator = "REJECTED";
    } else {
      summary.hasOtherFinalized = true;
      if (quote.status === "ACCEPTED") indicator = "ACCEPTED";
      else indicator = isQuoteExpired(quote.validUntil?.toISOString() ?? null, now) ? "EXPIRED" : "CURRENT";
    }
    if (!summary.indicator || indicatorPriority[indicator] > indicatorPriority[summary.indicator]) {
      summary.indicator = indicator;
    }
    summaries.set(key, summary);
  }
  return summaries;
}

export async function listCrmQuoteIndicators() {
  if (!prisma) throw new Error("No hay conexión a la base de datos.");
  const quotes = await prisma.quote.findMany({ where: { status: { not: "DRAFT" } }, select: crmQuoteFields });
  const indicators: Record<string, CrmQuoteIndicator> = {};
  for (const [key, { indicator }] of summarizeCrmQuotes(quotes)) {
    if (indicator) indicators[key] = indicator;
  }
  return indicators;
}

export function historicalQuoteDestination(stage: ClientCrmStage, summary?: QuoteSummary): ClientCrmStage | undefined {
  if (!summary) return;
  if ((stage === "NEW" || stage === "CONTACTED" || stage === "QUOTED") && summary.hasRejected && !summary.hasOtherFinalized) {
    return "PROPOSAL_REJECTED";
  }
  if (stage === "NEW" && summary.hasOtherFinalized) return "QUOTED";
}

export async function moveCrmStageForQuote(
  tx: Prisma.TransactionClient,
  { clientId, businessId }: QuoteOwner,
  fromStages: ClientCrmStage[],
  nextStage: ClientCrmStage,
  reason: { actorEmail: string; note: string },
) {
  const active = { deletedAt: null, crmArchiveState: null };
  const stages = { in: fromStages };
  const account = businessId
    ? await tx.business.findFirst({ where: { id: businessId, ...active, crmStage: stages }, select: { crmStage: true } })
    : await tx.client.findFirst({ where: { id: clientId, businessId: null, ...active, crmStage: stages }, select: { crmStage: true } });
  if (!account || account.crmStage === nextStage) return false;

  const conditions = { ...active, crmStage: account.crmStage };
  const { count } = businessId
    ? await tx.business.updateMany({ where: { id: businessId, ...conditions }, data: { crmStage: nextStage, crmPosition: null } })
    : await tx.client.updateMany({ where: { id: clientId, businessId: null, ...conditions }, data: { crmStage: nextStage } });
  if (!count) return false;

  await recordCrmChange(tx, {
    ...(businessId ? { accountId: businessId } : { clientId }),
    ...reason,
    event: "STAGE",
    fromState: account.crmStage,
    toState: nextStage,
  });
  return true;
}

export function advanceCrmForQuote(
  tx: Prisma.TransactionClient,
  quote: QuoteOwner & { number: string },
  event: "FINALIZED" | "ACCEPTED",
  actorEmail: string,
) {
  const accepted = event === "ACCEPTED";
  return moveCrmStageForQuote(tx, quote, accepted ? stageBeforeNegotiation : earlyStages, accepted ? "NEGOTIATION" : "QUOTED", {
    actorEmail,
    note: `Cotización ${quote.number} ${accepted ? "aceptada" : "creada"}.`,
  });
}
