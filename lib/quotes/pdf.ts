import { existsSync } from "node:fs";
import path from "node:path";

import PDFDocument from "pdfkit";

import { formatCurrency, TAX_RATE } from "../orders/service";
import { buildQuotePaymentUrls } from "./access";
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
  soft: "#F3F0FA",
  white: "#FFFFFF",
} as const;

const PAGE = {
  width: 595.28,
  height: 841.89,
  margin: 42,
};

const FOOTER_HEIGHT = 50;
const CONTINUATION_HEADER = 40;

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

function resolveHeaderLogoPath(): string | null {
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
    autoFirstPage: true,
    bufferPages: true,
    info: {
      Title: `Cotización ${quote.number}`,
      Author: SMARTPRO_COMPANY.brandName,
      Subject: `Cotización SmartPro ${quote.number}`,
      Keywords: "SmartPro, cotización, propuesta comercial",
    },
  });
  const done = collectPdf(doc);
  const contentWidth = PAGE.width - PAGE.margin * 2;
  const pageBottom = PAGE.height - FOOTER_HEIGHT - 18;
  const paymentUrls = buildQuotePaymentUrls(quote.id);
  let y = PAGE.margin;

  const drawFooter = () => {
    const footerY = PAGE.height - FOOTER_HEIGHT;
    doc.save();
    doc.rect(0, footerY, PAGE.width, FOOTER_HEIGHT).fill(COLORS.navy);
    doc.rect(0, footerY, PAGE.width, 3).fill(COLORS.magenta);
    doc.fillColor(COLORS.white).font("Helvetica").fontSize(8).text(
      `${SMARTPRO_COMPANY.brandName}  ·  ${SMARTPRO_COMPANY.email}  ·  ${SMARTPRO_COMPANY.phone}`,
      PAGE.margin,
      footerY + 14,
      { width: contentWidth, align: "center" },
    );
    doc.fillColor("#C9C6D6").fontSize(7.5).text(SMARTPRO_COMPANY.website, PAGE.margin, footerY + 28, {
      width: contentWidth,
      align: "center",
      link: SMARTPRO_COMPANY.website,
    });
    doc.restore();
  };

  const drawContinuationHeader = () => {
    doc.save();
    doc.rect(0, 0, PAGE.width, CONTINUATION_HEADER).fill(COLORS.navy);
    doc.rect(0, CONTINUATION_HEADER, PAGE.width / 2, 3).fill(COLORS.violet);
    doc.rect(PAGE.width / 2, CONTINUATION_HEADER, PAGE.width / 2, 3).fill(COLORS.magenta);
    doc.fillColor(COLORS.white).font("Helvetica-Bold").fontSize(10).text(`Cotización ${quote.number}`, PAGE.margin, 14, {
      width: contentWidth / 2,
    });
    doc.fillColor("#C9C6D6").font("Helvetica").fontSize(8).text(SMARTPRO_COMPANY.brandName, PAGE.margin, 14, {
      width: contentWidth,
      align: "right",
    });
    doc.restore();
  };

  const ensureSpace = (needed: number) => {
    if (y + needed < pageBottom) return;
    doc.addPage();
    drawContinuationHeader();
    y = CONTINUATION_HEADER + 18;
  };

  const drawSectionTitle = (title: string) => {
    ensureSpace(36);
    y += 10;
    doc.fillColor(COLORS.violet).font("Helvetica-Bold").fontSize(8).text(title.toUpperCase(), PAGE.margin, y);
    doc
      .moveTo(PAGE.margin, y + 12)
      .lineTo(PAGE.margin + 36, y + 12)
      .strokeColor(COLORS.magenta)
      .lineWidth(1.5)
      .stroke();
    y += 20;
  };

  const drawParagraph = (text: string, options?: { bold?: boolean; color?: string; size?: number }) => {
    const size = options?.size ?? 9;
    doc.font(options?.bold ? "Helvetica-Bold" : "Helvetica").fontSize(size);
    const height = doc.heightOfString(text, { width: contentWidth });
    ensureSpace(height + 10);
    doc.fillColor(options?.color ?? COLORS.ink).text(text, PAGE.margin, y, { width: contentWidth });
    y += height + 8;
  };

  const drawBullets = (items: string[]) => {
    for (const item of items) {
      const bullet = `•  ${item}`;
      doc.font("Helvetica").fontSize(9);
      const height = Math.max(14, doc.heightOfString(bullet, { width: contentWidth - 8 }));
      ensureSpace(height + 4);
      doc.fillColor(COLORS.ink).text(bullet, PAGE.margin, y, { width: contentWidth });
      y += height + 3;
    }
  };

  const drawButton = (input: {
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
    label: string;
    url?: string | null;
    textColor?: string;
    border?: string;
  }) => {
    doc.save();
    if (input.border) {
      doc.roundedRect(input.x, input.y, input.width, input.height, 7).lineWidth(1).strokeColor(input.border).fillAndStroke(input.fill, input.border);
    } else {
      doc.roundedRect(input.x, input.y, input.width, input.height, 7).fill(input.fill);
    }
    doc
      .fillColor(input.textColor ?? COLORS.white)
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(input.label, input.x + 6, input.y + input.height / 2 - 6, {
        width: input.width - 12,
        align: "center",
      });
    if (input.url) {
      doc.link(input.x, input.y, input.width, input.height, input.url);
    }
    doc.restore();
  };

  doc.rect(0, 0, PAGE.width, 108).fill(COLORS.navy);
  doc.rect(0, 0, 8, 108).fill(COLORS.magenta);
  doc
    .opacity(0.18)
    .polygon([PAGE.width - 170, 0], [PAGE.width, 0], [PAGE.width, 108], [PAGE.width - 70, 108])
    .fill(COLORS.violet);
  doc.opacity(1);
  doc.rect(0, 108, PAGE.width / 2, 4).fill(COLORS.violet);
  doc.rect(PAGE.width / 2, 108, PAGE.width / 2, 4).fill(COLORS.magenta);

  const logoPath = resolveHeaderLogoPath();
  if (logoPath) {
    doc.image(logoPath, PAGE.margin, 28, { fit: [210, 52] });
  } else {
    doc.fillColor(COLORS.white).font("Helvetica-Bold").fontSize(22).text(SMARTPRO_COMPANY.brandName, PAGE.margin, 36);
  }

  doc.fillColor(COLORS.white).font("Helvetica-Bold").fontSize(11).text(SMARTPRO_COMPANY.tagline, PAGE.margin, 36, {
    width: contentWidth,
    align: "right",
  });
  doc.fillColor("#D6D3E3").font("Helvetica").fontSize(8).text("Ideas  ·  Tecnología  ·  Resultados", PAGE.margin, 54, {
    width: contentWidth,
    align: "right",
  });
  doc.fillColor("#C9C6D6").fontSize(8).text(SMARTPRO_COMPANY.website.replace(/^https?:\/\//, ""), PAGE.margin, 70, {
    width: contentWidth,
    align: "right",
    link: SMARTPRO_COMPANY.website,
  });

  y = 128;
  doc.fillColor(COLORS.magenta).font("Helvetica-Bold").fontSize(8).text("COTIZACIÓN", PAGE.margin, y);
  y += 14;
  doc.fillColor(COLORS.navy).font("Helvetica-Bold").fontSize(24).text(quote.number, PAGE.margin, y);
  doc
    .moveTo(PAGE.margin, y + 30)
    .lineTo(PAGE.margin + 42, y + 30)
    .strokeColor(COLORS.magenta)
    .lineWidth(2.5)
    .stroke();
  doc.fillColor(COLORS.muted).font("Helvetica").fontSize(10).text("Propuesta comercial", PAGE.margin, y + 36);

  const dateCardWidth = 196;
  const dateCardX = PAGE.width - PAGE.margin - dateCardWidth;
  doc.roundedRect(dateCardX, 128, dateCardWidth, 62, 8).fill(COLORS.soft);
  doc.fillColor(COLORS.muted).font("Helvetica-Bold").fontSize(7).text("FECHA DE EMISIÓN", dateCardX + 14, 138);
  doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(9).text(formatDate(quote.createdAt), dateCardX + 14, 150, {
    width: dateCardWidth - 28,
  });
  doc.fillColor(COLORS.muted).font("Helvetica-Bold").fontSize(7).text("VÁLIDA HASTA", dateCardX + 14, 168);
  doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(9).text(formatDate(quote.validUntil), dateCardX + 14, 180, {
    width: dateCardWidth - 28,
  });

  y = 210;
  const cardGap = 12;
  const cardWidth = (contentWidth - cardGap) / 2;
  const issuerLines = [
    SMARTPRO_COMPANY.legalName,
    SMARTPRO_COMPANY.address,
    SMARTPRO_COMPANY.commune,
    SMARTPRO_COMPANY.phone,
    SMARTPRO_COMPANY.email,
    SMARTPRO_COMPANY.website.replace(/^https?:\/\//, ""),
  ];
  const clientLines = [
    quote.clientName,
    quote.clientRut ? `RUT ${quote.clientRut}` : "",
    quote.clientEmail,
    quote.clientPhone,
    quote.clientAddress,
  ].filter(Boolean);

  doc.font("Helvetica").fontSize(8.5);
  const issuerBody = `${SMARTPRO_COMPANY.brandName}\n${issuerLines.join("\n")}`;
  const clientTitle = quote.clientCompany || quote.clientName || "Cliente";
  const clientBody = `${clientTitle}\n${clientLines.join("\n")}`;
  const cardInnerWidth = cardWidth - 24;
  const issuerHeight = doc.heightOfString(issuerBody, { width: cardInnerWidth });
  const clientHeight = doc.heightOfString(clientBody, { width: cardInnerWidth });
  const cardHeight = Math.max(issuerHeight, clientHeight) + 36;

  ensureSpace(cardHeight + 8);
  doc.roundedRect(PAGE.margin, y, cardWidth, cardHeight, 10).fill(COLORS.surface);
  doc.roundedRect(PAGE.margin + cardWidth + cardGap, y, cardWidth, cardHeight, 10).fill(COLORS.surface);
  doc.fillColor(COLORS.violet).font("Helvetica-Bold").fontSize(7.5).text("EMITIDA POR", PAGE.margin + 12, y + 10);
  doc.fillColor(COLORS.violet).text("CLIENTE", PAGE.margin + cardWidth + cardGap + 12, y + 10);
  doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(10).text(SMARTPRO_COMPANY.brandName, PAGE.margin + 12, y + 24, {
    width: cardInnerWidth,
  });
  doc
    .font("Helvetica-Bold")
    .text(clientTitle, PAGE.margin + cardWidth + cardGap + 12, y + 24, { width: cardInnerWidth });
  doc
    .fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(8.5)
    .text(issuerLines.join("\n"), PAGE.margin + 12, y + 40, { width: cardInnerWidth });
  doc.text(clientLines.join("\n"), PAGE.margin + cardWidth + cardGap + 12, y + 40, { width: cardInnerWidth });
  y += cardHeight + 18;

  const columns = [
    { label: "Servicio / plan", width: 248 },
    { label: "Cant.", width: 48 },
    { label: "Precio", width: 92 },
    { label: "Total", width: 91 },
  ];
  const tableWidth = columns.reduce((sum, column) => sum + column.width, 0);

  ensureSpace(48);
  doc.roundedRect(PAGE.margin, y, tableWidth, 22, 6).fill(COLORS.navy);
  let headerX = PAGE.margin + 8;
  doc.fillColor(COLORS.white).font("Helvetica-Bold").fontSize(8);
  doc.text(columns[0].label, headerX, y + 7, { width: columns[0].width - 8 });
  headerX += columns[0].width;
  doc.text(columns[1].label, headerX, y + 7, { width: columns[1].width - 8, align: "right" });
  headerX += columns[1].width;
  doc.text(columns[2].label, headerX, y + 7, { width: columns[2].width - 8, align: "right" });
  headerX += columns[2].width;
  doc.text(columns[3].label, headerX, y + 7, { width: columns[3].width - 16, align: "right" });
  y += 22;

  for (const [index, item] of quote.items.entries()) {
    const name = item.planName || "Servicio";
    const category = `${item.categoryName}${item.subcategoryName ? ` · ${item.subcategoryName}` : ""}`;
    doc.font("Helvetica-Bold").fontSize(9);
    const nameHeight = doc.heightOfString(name, { width: columns[0].width - 12 });
    doc.font("Helvetica").fontSize(8);
    const categoryHeight = doc.heightOfString(category, { width: columns[0].width - 12 });
    const rowHeight = Math.max(34, nameHeight + categoryHeight + 14);

    ensureSpace(rowHeight + 4);
    if (index % 2 === 0) {
      doc.rect(PAGE.margin, y, tableWidth, rowHeight).fill(COLORS.surface);
    }

    const textX = PAGE.margin + 8;
    doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(9).text(name, textX, y + 6, {
      width: columns[0].width - 12,
    });
    doc.fillColor(COLORS.muted).font("Helvetica").fontSize(8).text(category, textX, y + 8 + nameHeight, {
      width: columns[0].width - 12,
    });

    const moneyY = y + Math.max(10, (rowHeight - 10) / 2);
    let moneyX = PAGE.margin + columns[0].width;
    doc.fillColor(COLORS.ink).font("Helvetica").fontSize(9);
    doc.text(String(item.quantity), moneyX, moneyY, { width: columns[1].width - 8, align: "right" });
    moneyX += columns[1].width;
    doc.text(formatCurrency(item.unitPrice), moneyX, moneyY, { width: columns[2].width - 8, align: "right" });
    moneyX += columns[2].width;
    doc.font("Helvetica-Bold").text(formatCurrency(item.subtotal), moneyX, moneyY, {
      width: columns[3].width - 16,
      align: "right",
    });
    y += rowHeight;
  }

  y += 14;
  ensureSpace(92);
  const totalsWidth = 230;
  const totalsX = PAGE.width - PAGE.margin - totalsWidth;
  const taxPercent = Math.round((quote.items[0]?.taxRate ?? TAX_RATE) * 100);

  const drawTotalRow = (label: string, value: string, muted = true) => {
    doc.fillColor(muted ? COLORS.muted : COLORS.ink).font("Helvetica").fontSize(9).text(label, totalsX, y, { width: 110 });
    doc.fillColor(COLORS.ink).text(value, totalsX + 110, y, { width: 120, align: "right" });
    y += 16;
  };

  drawTotalRow("Subtotal", formatCurrency(quote.subtotal));
  drawTotalRow(`IVA (${taxPercent}%)`, formatCurrency(quote.tax));
  doc.moveTo(totalsX, y).lineTo(PAGE.width - PAGE.margin, y).strokeColor(COLORS.border).lineWidth(1).stroke();
  y += 10;
  doc.fillColor(COLORS.navy).font("Helvetica-Bold").fontSize(10).text("INVERSIÓN TOTAL", totalsX, y + 2, { width: 110 });
  doc.fillColor(COLORS.magenta).font("Helvetica-Bold").fontSize(16).text(formatCurrency(quote.total), totalsX + 90, y, {
    width: 140,
    align: "right",
  });
  y += 22;
  doc.fillColor(COLORS.muted).font("Helvetica").fontSize(8).text("IVA incluido", totalsX, y, { width: totalsWidth, align: "right" });
  y += 18;

  const payBoxHeight = 92;
  ensureSpace(payBoxHeight + 8);
  doc.roundedRect(PAGE.margin, y, contentWidth, payBoxHeight, 12).fill(COLORS.soft);
  doc.fillColor(COLORS.navy).font("Helvetica-Bold").fontSize(12).text("Elige cómo pagar tu cotización", PAGE.margin + 16, y + 12, {
    width: contentWidth - 32,
  });
  doc.fillColor(COLORS.muted).font("Helvetica").fontSize(8.5).text("Paga fácil, seguro y 100% online. El monto se carga desde esta cotización.", PAGE.margin + 16, y + 30, {
    width: 320,
  });

  const buttonY = y + 48;
  const buttonHeight = 28;
  const buttonWidth = 132;
  drawButton({
    x: PAGE.margin + 16,
    y: buttonY,
    width: buttonWidth,
    height: buttonHeight,
    fill: COLORS.magenta,
    label: "Pagar con Webpay",
    url: paymentUrls?.webpayUrl,
  });
  drawButton({
    x: PAGE.margin + 16 + buttonWidth + 10,
    y: buttonY,
    width: buttonWidth + 16,
    height: buttonHeight,
    fill: COLORS.violet,
    label: "Pagar con Mercado Pago",
    url: paymentUrls?.mercadoPagoUrl,
  });
  drawButton({
    x: PAGE.width - PAGE.margin - 148,
    y: buttonY,
    width: 132,
    height: buttonHeight,
    fill: COLORS.white,
    textColor: COLORS.navy,
    border: COLORS.border,
    label: "Ver datos bancarios",
    url: paymentUrls?.bankUrl,
  });
  y += payBoxHeight + 8;
  doc.fillColor(COLORS.muted).font("Helvetica").fontSize(8).text("Aceptamos tarjetas de débito, crédito y prepago.", PAGE.margin, y, {
    width: contentWidth,
  });
  y += 10;

  const terms = buildQuoteCommercialTerms({
    items: quote.items,
    deliveryBusinessDays: quote.deliveryBusinessDays,
    initialPaymentPercent: quote.initialPaymentPercent,
    validUntilLabel: formatQuoteDateLabel(quote.validUntil),
  });

  drawSectionTitle(terms.scopeTitle);
  drawParagraph(terms.scopeIntro, { bold: true });

  if (terms.scopeGroups.length === 0) {
    drawParagraph("Según el detalle de los planes cotizados.", { color: COLORS.muted });
  } else {
    for (const group of terms.scopeGroups) {
      if (terms.scopeGroups.length > 1) {
        drawParagraph(group.planName, { bold: true });
      }
      drawBullets(group.items);
      y += 4;
    }
  }

  for (const section of terms.sections) {
    const isBankSection = section.title === "Medios de pago";
    if (isBankSection) {
      doc.addNamedDestination("datos-bancarios");
    }
    drawSectionTitle(section.title);
    if (section.intro) {
      drawParagraph(section.intro);
    }
    if (section.items?.length) {
      drawBullets(section.items);
    }
    if (section.paragraphs?.length) {
      for (const paragraph of section.paragraphs) {
        drawParagraph(paragraph);
      }
    }
  }

  if (quote.notes) {
    drawSectionTitle("Observaciones");
    drawParagraph(quote.notes);
  }

  drawSectionTitle("Contacto SmartPro");
  drawParagraph(
    `${SMARTPRO_COMPANY.brandName} · ${SMARTPRO_COMPANY.legalName}\n${SMARTPRO_COMPANY.address}, ${SMARTPRO_COMPANY.commune}\n${SMARTPRO_COMPANY.phone} · ${SMARTPRO_COMPANY.email}\n${SMARTPRO_COMPANY.website}`,
  );
  doc.fillColor(COLORS.muted).font("Helvetica").fontSize(8).text(`Estado interno: ${getQuoteStatusLabel(quote.status)}`, PAGE.margin, y, {
    width: contentWidth,
  });

  const range = doc.bufferedPageRange();
  for (let pageIndex = 0; pageIndex < range.count; pageIndex += 1) {
    doc.switchToPage(range.start + pageIndex);
    drawFooter();
    doc.fillColor("#C9C6D6").font("Helvetica").fontSize(7).text(`Página ${pageIndex + 1} de ${range.count}`, PAGE.margin, PAGE.height - 18, {
      width: contentWidth,
      align: "right",
    });
  }

  doc.end();
  return done;
}
