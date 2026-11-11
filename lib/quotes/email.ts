import { getAppUrl } from "../app-url";
import { sendEmail } from "../email/resend";
import { renderCorporateEmail } from "../email/template";
import { formatCurrency } from "../orders/service";
import { buildQuotePaymentUrls } from "./access";
import { SMARTPRO_COMPANY } from "./company";
import { buildQuotePdf } from "./pdf";
import { PAYMENT_SETUP_NOTICE, paymentScheduleText, proposalHasRenewal } from "./proposal";
import { formatQuoteDiscountLabel } from "./pricing";
import { getQuoteStatusLabel, type QuoteRecord } from "./types";

function formatDate(value: string | null): string {
  if (!value) return "Sin vencimiento";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin vencimiento";
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Santiago",
  }).format(date);
}

export function buildQuoteEmail(quote: QuoteRecord, appUrl = getAppUrl()) {
  const greetingName = quote.clientName || quote.clientCompany || "equipo";
  const accessUrls = buildQuotePaymentUrls(quote.id, appUrl);
  const paymentUrls = quote.proposal ? null : accessUrls;
  const proposal = quote.proposal;
  const totalLabel = proposalHasRenewal(proposal) ? "Base cotizada" : "Total de la cotización";
  const viewUrl = accessUrls?.viewUrl ?? appUrl.replace(/\/$/, "");

  return renderCorporateEmail({
    title: `Cotización ${quote.number} — SmartPro`,
    preheader: `Adjuntamos la cotización ${quote.number} por ${formatCurrency(quote.total)}.`,
    heading: `Cotización ${quote.number}`,
    greeting: `Hola ${greetingName},`,
    intro: [
      `Adjuntamos la cotización ${quote.number} preparada por ${SMARTPRO_COMPANY.brandName} para ${quote.clientCompany || quote.clientName}.`,
      "El documento PDF incluye el detalle de servicios, valores e información de pago.",
    ],
    highlight: {
      label: totalLabel,
      value: formatCurrency(quote.total),
    },
    details: [
      { label: "Número", value: quote.number },
      { label: "Estado", value: getQuoteStatusLabel(quote.status) },
      { label: "Emisión", value: formatDate(quote.createdAt) },
      ...(proposal?.showExpiration === false ? [] : [{ label: "Vencimiento", value: formatDate(quote.validUntil) }]),
      ...(proposal?.showDelivery ? [{ label: "Plazo de entrega", value: `${quote.deliveryBusinessDays} días hábiles` }] : []),
      ...(proposal?.showDeposit ? [{ label: "Pago inicial propuesto", value: `${quote.initialPaymentPercent}%` }] : []),
      ...(proposal?.payments.map((schedule, index) => ({
        label: quote.items[index].planName,
        value: paymentScheduleText(schedule),
      })) ?? []),
      ...(proposal?.blocks.map(({ title, description }) => ({ label: title, value: description })) ?? []),
      { label: "Servicios", value: String(quote.items.length) },
      ...(formatQuoteDiscountLabel(quote)
        ? [{ label: "Descuento", value: `${formatQuoteDiscountLabel(quote)} (${formatCurrency(quote.discountAmount)})` }]
        : []),
    ],
    notices: [...(proposal ? [PAYMENT_SETUP_NOTICE] : []), "Este correo incluye la cotización en PDF como archivo adjunto."],
    closing: "Quedamos atentos para resolver cualquier consulta y coordinar el siguiente paso.",
    cta: {
      href: viewUrl,
      label: paymentUrls ? "Ver cotización y pagar" : proposal ? "Ver cotización" : "Visitar SmartPro",
    },
    appUrl,
  });
}

export async function sendQuoteEmail(quote: QuoteRecord) {
  if (!quote.clientEmail) {
    throw new Error("El cliente no tiene un correo electrónico registrado.");
  }

  const outboundQuote = { ...quote, status: "SENT" as const };
  const { html, text } = buildQuoteEmail(outboundQuote);
  const pdf = await buildQuotePdf(outboundQuote);

  return sendEmail({
    to: quote.clientEmail,
    subject: `Cotización ${quote.number} — SmartPro`,
    html,
    text,
    attachments: [
      {
        filename: `${quote.number}.pdf`,
        content: pdf,
        contentType: "application/pdf",
      },
    ],
  });
}
