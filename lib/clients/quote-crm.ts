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
const stageBeforeNegotiation: ClientCrmStage[] = ["NEW", "CONTACTED", "QUOTED", "PROPOSAL_REJECTED"];
const quoteStageTransitions = {
  FINALIZED: { stage: "CONTACTED", action: "creada" },
  SENT: { stage: "QUOTED", action: "enviada" },
  ACCEPTED: { stage: "NEGOTIATION", action: "aceptada" },
} as const;

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
  fromStages: ClientCrmStage[] | null,
  nextStage: ClientCrmStage,
  reason: { actorEmail: string; note: string },
) {
  const eligible = {
    deletedAt: null,
    ...(fromStages ? { crmArchiveState: null, crmStage: { in: fromStages } } : {}),
  };
  const select = { crmStage: true, crmArchiveState: true, crmReactivateOn: true } as const;
  const account = businessId
    ? await tx.business.findFirst({ where: { id: businessId, ...eligible }, select })
    : await tx.client.findFirst({ where: { id: clientId, businessId: null, ...eligible }, select });
  if (!account) return false;

  const fromState = account.crmArchiveState ?? account.crmStage;
  if (fromState === nextStage) return false;

  const conditions = {
    deletedAt: null,
    crmStage: account.crmStage,
    crmArchiveState: account.crmArchiveState,
    crmReactivateOn: account.crmReactivateOn,
  };
  const data = {
    crmStage: nextStage,
    ...(account.crmArchiveState ? { crmArchiveState: null, crmReactivateOn: null } : {}),
  };
  const { count } = businessId
    ? await tx.business.updateMany({ where: { id: businessId, ...conditions }, data: { ...data, crmPosition: null } })
    : await tx.client.updateMany({ where: { id: clientId, businessId: null, ...conditions }, data });
  if (!count) return false;

  await recordCrmChange(tx, {
    ...(businessId ? { accountId: businessId } : { clientId }),
    event: account.crmArchiveState ? "REACTIVATION" : "STAGE",
    fromState,
    toState: nextStage,
    ...reason,
    ...(account.crmArchiveState && account.crmReactivateOn ? { reactivateOn: account.crmReactivateOn } : {}),
  });
  return true;
}

export function advanceCrmForQuote(
  tx: Prisma.TransactionClient,
  quote: QuoteOwner & { number: string },
  event: keyof typeof quoteStageTransitions,
  actorEmail: string,
) {
  const { stage, action } = quoteStageTransitions[event];
  const fromStages = event === "ACCEPTED" ? stageBeforeNegotiation : null;
  return moveCrmStageForQuote(tx, quote, fromStages, stage, {
    actorEmail,
    note: `Cotización ${quote.number} ${action}.`,
  });
}
