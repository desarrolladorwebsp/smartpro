import { existsSync } from "node:fs";
import path from "node:path";

import PDFDocument from "pdfkit";

import { formatCurrency } from "../orders/service";
import { SMARTPRO_COMPANY } from "./company";
import { formatQuoteDateLabel } from "./dates";
import { buildQuoteCommercialTerms } from "./terms";
import { getQuoteStatusLabel, type QuoteRecord } from "./types";

const COLORS = {
  navy: "#101024",
  violet: "#6D28D9",
  magenta: "#EC168C",
  ink: "#0B0B14",
  muted: "#6E6B7B",
  border: "#E8E5EF",
  surface: "#F8F7FC",
  white: "#FFFFFF",
} as const;

const PAGE = {
  width: 595.28,
  height: 841.89,
  margin: 48,
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Santiago",
  }).format(date);
}

function resolveLogoPath(): string | null {
  const candidates = [
    path.join(process.cwd(), "public/images/logo/logo-smartpro-full.png"),
    path.join(process.cwd(), "public/images/logo/logo-smartpro-01.png"),
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function collectPdf(doc: InstanceType<typeof PDFDocument>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

export async function buildQuotePdf(quote: QuoteRecord): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margin: PAGE.margin,
    info: {
      Title: `Cotización ${quote.number}`,
      Author: SMARTPRO_COMPANY.brandName,
      Subject: `Cotización SmartPro ${quote.number}`,
    },
  });
  const done = collectPdf(doc);
  const contentWidth = PAGE.width - PAGE.margin * 2;
  let y = PAGE.margin;

  const ensureSpace = (needed: number) => {
    if (y + needed < PAGE.height - 72) return;
    doc.addPage();
    y = PAGE.margin;
  };

  doc.rect(0, 0, PAGE.width, 18).fill(COLORS.navy);
  doc.rect(0, 18, PAGE.width / 2, 4).fill(COLORS.violet);
  doc.rect(PAGE.width / 2, 18, PAGE.width / 2, 4).fill(COLORS.magenta);

  y = 40;
  const logoPath = resolveLogoPath();
  if (logoPath) {
    doc.image(logoPath, PAGE.margin, y, { fit: [168, 40] });
  } else {
    doc.fillColor(COLORS.navy).font("Helvetica-Bold").fontSize(18).text(SMARTPRO_COMPANY.brandName, PAGE.margin, y);
  }

  doc.fillColor(COLORS.navy).font("Helvetica-Bold").fontSize(16).text("COTIZACIÓN", PAGE.margin, y, {
    width: contentWidth,
    align: "right",
  });
  doc.fillColor(COLORS.violet).font("Helvetica-Bold").fontSize(12).text(quote.number, PAGE.margin, y + 20, {
    width: contentWidth,
    align: "right",
  });
  doc.fillColor(COLORS.muted).font("Helvetica").fontSize(9).text(`Estado: ${getQuoteStatusLabel(quote.status)}`, PAGE.margin, y + 38, {
    width: contentWidth,
    align: "right",
  });

  y += 70;
  doc.moveTo(PAGE.margin, y).lineTo(PAGE.width - PAGE.margin, y).strokeColor(COLORS.border).lineWidth(1).stroke();
  y += 16;

  const columnWidth = (contentWidth - 16) / 2;
  doc.fillColor(COLORS.violet).font("Helvetica-Bold").fontSize(8).text("EMITIDA POR", PAGE.margin, y);
  doc.fillColor(COLORS.violet).text("CLIENTE", PAGE.margin + columnWidth + 16, y);
  y += 14;

  doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(11).text(SMARTPRO_COMPANY.brandName, PAGE.margin, y, { width: columnWidth });
  doc.text(quote.clientCompany || quote.clientName, PAGE.margin + columnWidth + 16, y, { width: columnWidth });
  y += 16;

  const leftLines = [
    SMARTPRO_COMPANY.legalName,
    SMARTPRO_COMPANY.address,
    SMARTPRO_COMPANY.commune,
    SMARTPRO_COMPANY.phone,
    SMARTPRO_COMPANY.email,
    SMARTPRO_COMPANY.website,
  ];
  const rightLines = [
    quote.clientName,
    quote.clientRut ? `RUT ${quote.clientRut}` : "",
    quote.clientEmail,
    quote.clientPhone,
    quote.clientAddress,
  ].filter(Boolean);

  doc.fillColor(COLORS.muted).font("Helvetica").fontSize(9);
  const leftHeight = doc.heightOfString(leftLines.join("\n"), { width: columnWidth });
  const rightHeight = doc.heightOfString(rightLines.join("\n"), { width: columnWidth });
  doc.text(leftLines.join("\n"), PAGE.margin, y, { width: columnWidth });
  doc.text(rightLines.join("\n"), PAGE.margin + columnWidth + 16, y, { width: columnWidth });
  y += Math.max(leftHeight, rightHeight) + 18;

  doc.fillColor(COLORS.muted).font("Helvetica").fontSize(9);
  doc.text(`Fecha de emisión: ${formatDate(quote.createdAt)}`, PAGE.margin, y, { width: columnWidth });
  doc.text(`Válida hasta: ${formatDate(quote.validUntil)}`, PAGE.margin + columnWidth + 16, y, { width: columnWidth });
  y += 22;

  const columns = [
    { label: "Servicio / plan", width: 230 },
    { label: "Cant.", width: 40 },
    { label: "Precio", width: 90 },
    { label: "Total", width: 90 },
  ];

  ensureSpace(48);
  doc.rect(PAGE.margin, y, contentWidth, 22).fill(COLORS.navy);
  let x = PAGE.margin + 8;
  doc.fillColor(COLORS.white).font("Helvetica-Bold").fontSize(8);
  doc.text(columns[0].label, x, y + 7, { width: columns[0].width });
  x += columns[0].width;
  doc.text(columns[1].label, x, y + 7, { width: columns[1].width, align: "right" });
  x += columns[1].width;
  doc.text(columns[2].label, x, y + 7, { width: columns[2].width, align: "right" });
  x += columns[2].width;
  doc.text(columns[3].label, x, y + 7, { width: columns[3].width, align: "right" });
  y += 22;

  for (const [index, item] of quote.items.entries()) {
    const blockHeight = 32;
    ensureSpace(blockHeight + 8);

    if (index % 2 === 0) {
      doc.rect(PAGE.margin, y, contentWidth, blockHeight).fill(COLORS.surface);
    }

    x = PAGE.margin + 8;
    doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(9).text(item.planName, x, y + 6, { width: columns[0].width });
    doc.fillColor(COLORS.muted).font("Helvetica").fontSize(8).text(`${item.categoryName}${item.subcategoryName ? ` · ${item.subcategoryName}` : ""}`, x, y + 18, {
      width: columns[0].width,
    });

    const moneyY = y + 10;
    doc.fillColor(COLORS.ink).font("Helvetica").fontSize(9);
    doc.text(String(item.quantity), x + columns[0].width, moneyY, { width: columns[1].width, align: "right" });
    doc.text(formatCurrency(item.unitPrice), x + columns[0].width + columns[1].width, moneyY, {
      width: columns[2].width,
      align: "right",
    });
    doc.font("Helvetica-Bold").text(formatCurrency(item.subtotal), x + columns[0].width + columns[1].width + columns[2].width, moneyY, {
      width: columns[3].width,
      align: "right",
    });

    y += blockHeight;
  }

  y += 16;
  ensureSpace(90);
  const totalsX = PAGE.margin + contentWidth - 210;
  const drawTotalRow = (label: string, value: string, emphasize = false) => {
    doc.fillColor(emphasize ? COLORS.navy : COLORS.muted).font(emphasize ? "Helvetica-Bold" : "Helvetica").fontSize(emphasize ? 12 : 9);
    doc.text(label, totalsX, y, { width: 100 });
    doc.fillColor(emphasize ? COLORS.violet : COLORS.ink).text(value, totalsX + 100, y, { width: 110, align: "right" });
    y += emphasize ? 20 : 16;
  };

  drawTotalRow("Subtotal", formatCurrency(quote.subtotal));
  drawTotalRow("IVA", formatCurrency(quote.tax));
  doc.moveTo(totalsX, y).lineTo(PAGE.width - PAGE.margin, y).strokeColor(COLORS.border).stroke();
  y += 8;
  drawTotalRow("Total", formatCurrency(quote.total), true);

  const terms = buildQuoteCommercialTerms({
    items: quote.items,
    deliveryBusinessDays: quote.deliveryBusinessDays,
    initialPaymentPercent: quote.initialPaymentPercent,
    validUntilLabel: formatQuoteDateLabel(quote.validUntil),
  });

  const drawSectionTitle = (title: string) => {
    ensureSpace(36);
    y += 12;
    doc.fillColor(COLORS.violet).font("Helvetica-Bold").fontSize(8).text(title.toUpperCase(), PAGE.margin, y);
    y += 14;
  };

  drawSectionTitle(terms.scopeTitle);
  doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(9).text(terms.scopeIntro, PAGE.margin, y, { width: contentWidth });
  y += doc.heightOfString(terms.scopeIntro, { width: contentWidth }) + 8;

  if (terms.scopeGroups.length === 0) {
    doc.fillColor(COLORS.muted).font("Helvetica").fontSize(9).text("Según el detalle de los planes cotizados.", PAGE.margin, y, {
      width: contentWidth,
    });
    y += 16;
  } else {
    for (const group of terms.scopeGroups) {
      if (terms.scopeGroups.length > 1) {
        ensureSpace(24);
        doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(9).text(group.planName, PAGE.margin, y, { width: contentWidth });
        y += 14;
      }
      const bullets = group.items.map((entry) => `• ${entry}`).join("\n");
      ensureSpace(doc.heightOfString(bullets, { width: contentWidth }) + 12);
      doc.fillColor(COLORS.ink).font("Helvetica").fontSize(9).text(bullets, PAGE.margin, y, { width: contentWidth });
      y += doc.heightOfString(bullets, { width: contentWidth }) + 10;
    }
  }

  for (const section of terms.sections) {
    drawSectionTitle(section.title);
    if (section.intro) {
      ensureSpace(doc.heightOfString(section.intro, { width: contentWidth }) + 12);
      doc.fillColor(COLORS.ink).font("Helvetica").fontSize(9).text(section.intro, PAGE.margin, y, { width: contentWidth });
      y += doc.heightOfString(section.intro, { width: contentWidth }) + 8;
    }
    if (section.items?.length) {
      const bullets = section.items.map((entry) => `• ${entry}`).join("\n");
      ensureSpace(doc.heightOfString(bullets, { width: contentWidth }) + 12);
      doc.fillColor(COLORS.ink).font("Helvetica").fontSize(9).text(bullets, PAGE.margin, y, { width: contentWidth });
      y += doc.heightOfString(bullets, { width: contentWidth }) + 8;
    }
    if (section.paragraphs?.length) {
      const text = section.paragraphs.join("\n");
      ensureSpace(doc.heightOfString(text, { width: contentWidth }) + 12);
      doc.fillColor(COLORS.ink).font("Helvetica").fontSize(9).text(text, PAGE.margin, y, { width: contentWidth });
      y += doc.heightOfString(text, { width: contentWidth }) + 8;
    }
  }

  if (quote.notes) {
    drawSectionTitle("Observaciones");
    doc.fillColor(COLORS.ink).font("Helvetica").fontSize(9).text(quote.notes, PAGE.margin, y, { width: contentWidth });
    y += doc.heightOfString(quote.notes, { width: contentWidth }) + 16;
  }

  doc.rect(0, PAGE.height - 42, PAGE.width, 42).fill(COLORS.navy);
  doc.fillColor(COLORS.white).font("Helvetica").fontSize(8).text(
    `${SMARTPRO_COMPANY.brandName}  ·  ${SMARTPRO_COMPANY.email}  ·  ${SMARTPRO_COMPANY.phone}  ·  ${SMARTPRO_COMPANY.website}`,
    PAGE.margin,
    PAGE.height - 28,
    { width: contentWidth, align: "center" },
  );

  doc.end();
  return done;
}
