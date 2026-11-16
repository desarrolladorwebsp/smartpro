import { paymentScheduleText, type QuoteProposal } from "./proposal";
import { remainingPaymentPercent } from "./fields";
import { getQuotePaymentMethods } from "./payment-methods";
import { SMARTPRO_AGENCY_ID } from "../agencies/types";
import type { AgencyIdentity } from "../agencies/types";

export type QuoteScopeGroup = {
  planName: string;
  items: string[];
};

export type QuoteTermsSection = {
  title: string;
  intro?: string;
  items?: string[];
  paragraphs?: string[];
};

export type QuoteCommercialTerms = {
  scopeTitle: string;
  scopeIntro: string;
  scopeGroups: QuoteScopeGroup[];
  sections: QuoteTermsSection[];
};

export function buildPaymentConditionText(initialPercent: number): string {
  const normalized = Math.trunc(Number(initialPercent));

  if (normalized >= 100) {
    return "Se requiere el 100% del pago para iniciar el proyecto.";
  }

  const remaining = remainingPaymentPercent(normalized);
  return `Se requiere un ${normalized}% de abono inicial para comenzar el proyecto. El ${remaining}% restante deberá pagarse al momento de la entrega.`;
}

export function buildDeliveryIntro(days: number): string {
  return `El plazo estimado de entrega es de ${days} días hábiles, dependiendo de la complejidad del proyecto.`;
}

export function buildServiceScope(items: Array<{ planName: string; includedItems: string[] }>): QuoteScopeGroup[] {
  return items
    .map((item) => ({
      planName: item.planName,
      items: [...new Set(item.includedItems.map((entry) => entry.trim()).filter(Boolean))],
    }))
    .filter((group) => group.items.length > 0);
}

export function buildQuoteCommercialTerms(input: {
  items: Array<{ planName: string; includedItems: string[] }>;
  agency: AgencyIdentity;
  deliveryBusinessDays: number;
  initialPaymentPercent: number;
  validUntilLabel: string;
  proposal?: QuoteProposal | null;
}): QuoteCommercialTerms {
  const bankLines = [
    input.agency.bankAccountHolder,
    input.agency.bankRut ? `RUT ${input.agency.bankRut}` : "",
    input.agency.bankName,
    input.agency.bankAccountType,
    input.agency.bankAccountNumber ? `N° ${input.agency.bankAccountNumber}` : "",
    input.agency.bankEmail,
  ].filter(Boolean);

  return {
    scopeTitle: "Alcance del servicio",
    scopeIntro: "El servicio contratado incluye:",
    scopeGroups: buildServiceScope(input.items),
    sections: [
      ...(input.proposal?.showDelivery === false ? [] : [{
        title: "Plazo estimado",
        intro: buildDeliveryIntro(input.deliveryBusinessDays),
        items: [
          ...(input.proposal ? [] : ["El plazo comienza una vez confirmado el pago o abono inicial."]),
          "El plazo comienza una vez recibida toda la información necesaria por parte del cliente.",
          "Retrasos en la entrega de información por parte del cliente impactarán directamente en los plazos.",
        ],
      }]),
      ...(input.proposal?.showDeposit === false ? [] : [{
        title: "Condiciones de pago",
        paragraphs: [input.proposal
          ? `Porcentaje de pago inicial propuesto: ${input.initialPaymentPercent}%.`
          : buildPaymentConditionText(input.initialPaymentPercent)],
      }]),
      ...(input.proposal?.showExpiration === false ? [] : [{
        title: "Vencimiento",
        paragraphs: [`Esta cotización es válida hasta el ${input.validUntilLabel}.`],
      }]),
      ...(input.proposal ? [
        {
          title: "Calendario de pagos (IVA incluido)",
          items: input.proposal.payments.map((schedule, index) =>
            `${input.items[index].planName}: ${paymentScheduleText(schedule)}`),
        },
        ...input.proposal.blocks.map((block) => ({ title: block.title, paragraphs: [block.description] })),
      ] : []),
      {
        title: input.proposal ? "Datos bancarios" : "Medios de pago",
        items: input.proposal ? undefined : (input.agency.id === SMARTPRO_AGENCY_ID
          ? getQuotePaymentMethods().map((method) => method.title)
          : ["Transferencia bancaria"]),
        paragraphs: [
          ...(input.proposal ? [] : ["Datos bancarios:"]),
          ...bankLines,
          ...(input.agency.offices ? ["Oficinas:", ...input.agency.offices.split(";").map((office) => office.trim()).filter(Boolean)] : []),
        ],
      },
    ],
  };
}
