import { proposalHasRenewal, type QuoteProposal } from "../quotes/proposal";
import type { QuoteStatus } from "../quotes/types";
import type { SaleSource } from "./types";

export type QuoteConversionCheck = {
  convertible: boolean;
  reason?: string;
};

const MANUAL_ALLOWED: QuoteStatus[] = ["CREATED", "SENT", "ACCEPTED"];

export function getQuoteSaleConversionCheck(
  status: QuoteStatus,
  alreadyConverted: boolean,
  source: SaleSource = "MANUAL",
  proposal?: QuoteProposal | null,
): QuoteConversionCheck {
  if (alreadyConverted) {
    return { convertible: false, reason: "Esta cotización ya fue convertida en venta." };
  }

  if (status === "DRAFT") {
    return { convertible: false, reason: "No se puede convertir un borrador." };
  }

  if (status === "REJECTED") {
    return { convertible: false, reason: "No se puede convertir una cotización rechazada." };
  }

  if (source === "QUOTE_ACCEPTED" && status !== "ACCEPTED") {
    return { convertible: false, reason: "La conversión automática requiere una cotización aceptada." };
  }

  if (source === "MANUAL" && !MANUAL_ALLOWED.includes(status)) {
    return { convertible: false, reason: "Esta cotización no se puede convertir en venta." };
  }

  if (proposal && status !== "ACCEPTED") {
    return { convertible: false, reason: "Acepta la cotización antes de convertirla en venta." };
  }

  if (proposalHasRenewal(proposal)) {
    return { convertible: false, reason: "Coordina el cobro mensual renovable antes de registrar la venta." };
  }

  return { convertible: true };
}

export function assertQuoteConvertible(
  status: QuoteStatus,
  alreadyConverted: boolean,
  source: SaleSource = "MANUAL",
  proposal?: QuoteProposal | null,
) {
  const check = getQuoteSaleConversionCheck(status, alreadyConverted, source, proposal);
  if (!check.convertible) {
    throw new Error(check.reason ?? "Esta cotización no se puede convertir en venta.");
  }
}
