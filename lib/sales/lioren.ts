import { createHash } from "node:crypto";
import { prisma } from "../db";
import { getClientById } from "../clients/repository";
import { getSaleById } from "./repository";
import { ensureSalePaymentTable } from "./schema";
import { buildLiorenInvoiceEmail, decodeLiorenInvoicePdf, type LiorenInvoiceDraft, type LiorenInvoiceDetail, type SaleRecord } from "./types";
import { sendEmail } from "../email/resend";

const IVA_RATE = 0.19;
const MAX_DETAILS = 60;

export function getLiorenConfig() {
  const token = process.env.LIOREN_API_TOKEN?.trim() ?? "";
  const baseUrl = (process.env.LIOREN_API_BASE_URL?.trim() ?? "").replace(/\/+$/, "");
  return { configured: Boolean(token && baseUrl), baseUrl };
}

function dateOnly(value: string | null | undefined) {
  return value ? value.slice(0, 10) : new Date().toISOString().slice(0, 10);
}

export async function createDefaultLiorenInvoiceDraft(sale: SaleRecord): Promise<LiorenInvoiceDraft> {
  const client = await getClientById(sale.clientId);
  if (!client) throw new Error("No se encontró el cliente asociado a la venta.");

  const serviceName = sale.observation.match(/^Servicio:\s*(.+)$/m)?.[1]?.trim() || `Servicios Smartpro - ${sale.number}`;
  // All SmartPro invoices are taxable (SII type 33). For legacy/direct sales
  // recorded with zero tax, treat the agreed sale total as VAT-inclusive and
  // back-calculate the net so the invoice total remains equal to the sale.
  const netPrice = sale.tax === 0 ? Math.round(sale.total / (1 + IVA_RATE)) : sale.subtotal;
  return {
    tipoDocumento: "33",
    fecha: dateOnly(sale.soldAt),
    vencimiento: "",
    observaciones: "",
    receptor: {
      rut: client.rut,
      rs: client.companyName,
      giro: "",
      comuna: "",
      ciudad: "",
      direccion: client.address,
      email: client.email,
      telefono: client.phone,
    },
    detalles: [{ codigo: "SRV", nombre: serviceName.slice(0, 80), cantidad: 1, unidad: "UN", precio: netPrice, exento: false }],
  };
}

function cleanText(value: unknown, label: string, min: number, max: number): string {
  const text = String(value ?? "").trim();
  if (text.length < min || text.length > max) throw new Error(`${label}: ingresa entre ${min} y ${max} caracteres.`);
  return text;
}

function validDate(value: unknown, label: string, optional = false): string {
  const date = String(value ?? "").trim();
  if (!date && optional) return "";
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00Z`) : null;
  if (!parsed || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new Error(`${label}: ingresa una fecha válida.`);
  }
  return date;
}

export function validateLiorenInvoiceDraft(value: unknown): LiorenInvoiceDraft {
  if (!value || typeof value !== "object") throw new Error("Completa los datos de facturación.");
  const input = value as Record<string, unknown>;
  const receptorInput = input.receptor && typeof input.receptor === "object"
    ? input.receptor as Record<string, unknown>
    : {};
  if (input.tipoDocumento !== "33") throw new Error("SmartPro solo emite facturas afectas con IVA (tipo 33).");
  const tipoDocumento = "33" as const;

  if (!Array.isArray(input.detalles) || input.detalles.length < 1 || input.detalles.length > MAX_DETAILS) {
    throw new Error(`La factura debe tener entre 1 y ${MAX_DETAILS} ítems.`);
  }
  const detalles: LiorenInvoiceDetail[] = input.detalles.map((entry, index) => {
    if (!entry || typeof entry !== "object") throw new Error(`Revisa el ítem ${index + 1}.`);
    const item = entry as Record<string, unknown>;
    if (item.exento === true) throw new Error(`El ítem ${index + 1} no puede ser exento; todas las facturas SmartPro llevan IVA.`);
    const cantidad = Number(item.cantidad);
    const precio = Number(item.precio);
    if (!Number.isFinite(cantidad) || cantidad <= 0 || cantidad > 999999999) throw new Error(`Cantidad inválida en el ítem ${index + 1}.`);
    if (!Number.isSafeInteger(precio) || precio < 0 || precio > 999999999) throw new Error(`Precio inválido en el ítem ${index + 1}.`);
    return {
      codigo: String(item.codigo ?? "").trim().slice(0, 128),
      nombre: cleanText(item.nombre, `Nombre del ítem ${index + 1}`, 3, 80),
      cantidad,
      unidad: String(item.unidad ?? "UN").trim().slice(0, 4) || "UN",
      precio,
      exento: false,
    };
  });

  const rut = String(receptorInput.rut ?? "").replace(/[^0-9kK]/g, "").toUpperCase();
  if (rut.length < 8 || rut.length > 9) throw new Error("Ingresa un RUT chileno válido para el receptor.");
  const comuna = String(receptorInput.comuna ?? "").trim();
  const ciudad = String(receptorInput.ciudad ?? "").trim();
  if (!/^\d+$/.test(comuna) || !/^\d+$/.test(ciudad)) {
    throw new Error("Ingresa los códigos numéricos de comuna y ciudad que entrega Lioren.");
  }
  const email = String(receptorInput.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 80) {
    throw new Error("Ingresa un correo válido del receptor para enviar la factura.");
  }
  const vencimiento = validDate(input.vencimiento, "Vencimiento", true);
  const fecha = validDate(input.fecha, "Fecha de emisión");
  if (vencimiento && vencimiento < fecha) throw new Error("El vencimiento no puede ser anterior a la fecha de emisión.");

  return {
    tipoDocumento,
    fecha,
    vencimiento,
    observaciones: String(input.observaciones ?? "").trim().slice(0, 250),
    receptor: {
      rut,
      rs: cleanText(receptorInput.rs, "Razón social", 5, 100),
      giro: cleanText(receptorInput.giro, "Giro", 5, 40),
      comuna,
      ciudad,
      direccion: cleanText(receptorInput.direccion, "Dirección tributaria", 5, 70),
      email,
      telefono: String(receptorInput.telefono ?? "").replace(/\D/g, "").slice(-9),
    },
    detalles,
  };
}

function assertInvoiceMatchesSale(draft: LiorenInvoiceDraft, sale: SaleRecord) {
  if (draft.tipoDocumento !== "33" || draft.detalles.some((item) => item.exento)) {
    throw new Error("SmartPro solo emite facturas afectas con IVA (tipo 33); revisa el detalle.");
  }
  const neto = draft.detalles.reduce((total, item) => total + item.cantidad * item.precio, 0);
  const afecto = draft.detalles.reduce((total, item) => total + (item.exento ? 0 : item.cantidad * item.precio), 0);
  const total = Math.round(neto + Math.round(afecto * IVA_RATE));
  if (Math.abs(total - sale.total) > 1) {
    throw new Error(`El total de la factura (${total}) debe coincidir con el total de la venta (${sale.total}). Ajusta los ítems antes de emitir.`);
  }
}

function liorenPayload(draft: LiorenInvoiceDraft) {
  const issuerEmail = process.env.LIOREN_ISSUER_EMAIL?.trim();
  const issuerPhone = process.env.LIOREN_ISSUER_PHONE?.replace(/\D/g, "").slice(-9);
  const activity = Number(process.env.LIOREN_ISSUER_ACTIVITY_CODE);
  const emisor: Record<string, unknown> = { tipodoc: draft.tipoDocumento, fecha: draft.fecha };
  if (draft.vencimiento) emisor.vencimiento = draft.vencimiento;
  if (draft.observaciones) emisor.observaciones = draft.observaciones;
  if (issuerEmail) emisor.email = issuerEmail;
  if (issuerPhone && issuerPhone.length === 9) emisor.telefono = Number(issuerPhone);
  if (Number.isSafeInteger(activity) && activity > 0) emisor.actividad = activity;

  return {
    emisor,
    receptor: {
      rut: draft.receptor.rut,
      rs: draft.receptor.rs,
      giro: draft.receptor.giro,
      comuna: Number(draft.receptor.comuna),
      ciudad: Number(draft.receptor.ciudad),
      direccion: draft.receptor.direccion,
      ...(draft.receptor.email ? { email: draft.receptor.email } : {}),
      ...(draft.receptor.telefono.length === 9 ? { telefono: draft.receptor.telefono } : {}),
    },
    detalles: draft.detalles,
    expects: "pdf",
  };
}

async function sendInvoicePdfEmail(input: { sale: SaleRecord; pdf: Buffer }) {
  const email = input.sale.liorenInvoice.draft?.receptor.email?.trim();
  if (!email) return { delivered: false as const, error: "Falta el correo del receptor en el borrador de factura." };

  const result = await sendEmail(buildLiorenInvoiceEmail({
    saleNumber: input.sale.number,
    folio: input.sale.liorenInvoice.folio,
    customerEmail: email,
    pdf: input.pdf,
  }));
  if (!result.delivered) {
    return { delivered: false as const, error: result.error ?? "No se configuró o no se pudo completar el envío del correo." };
  }
  return { delivered: true as const };
}

export async function getLiorenInvoicePdf(saleId: string): Promise<{ pdf: Buffer; filename: string }> {
  if (!prisma) throw new Error("No hay conexión a la base de datos.");
  const sale = await getSaleById(saleId);
  if (!sale || sale.liorenInvoice.status !== "ISSUED") throw new Error("No hay una factura emitida para esta venta.");
  const rows = await prisma.$queryRaw<Array<{ liorenInvoicePdf: string | null }>>`SELECT liorenInvoicePdf FROM Sale WHERE id = ${saleId} LIMIT 1`;
  const pdf = decodeLiorenInvoicePdf(rows[0]?.liorenInvoicePdf);
  if (!pdf) throw new Error("Lioren no devolvió un PDF disponible para esta factura.");
  return { pdf, filename: `Factura-${sale.liorenInvoice.folio ?? sale.number}.pdf` };
}

export async function resendLiorenInvoiceEmail(saleId: string): Promise<SaleRecord> {
  if (!prisma) throw new Error("No hay conexión a la base de datos.");
  const sale = await getSaleById(saleId);
  if (!sale || sale.liorenInvoice.status !== "ISSUED") throw new Error("No hay una factura emitida para esta venta.");
  if (sale.archivedAt) throw new Error("No se puede reenviar una factura de una venta oculta.");
  const rows = await prisma.$queryRaw<Array<{ liorenInvoicePdf: string | null }>>`SELECT liorenInvoicePdf FROM Sale WHERE id = ${saleId} LIMIT 1`;
  const pdf = decodeLiorenInvoicePdf(rows[0]?.liorenInvoicePdf);
  if (!pdf) throw new Error("Lioren no devolvió un PDF disponible para esta factura.");

  const delivery = await sendInvoicePdfEmail({ sale, pdf });
  await prisma.$executeRaw`UPDATE Sale SET liorenInvoiceEmailSentAt = ${delivery.delivered ? new Date() : null}, liorenInvoiceEmailError = ${delivery.delivered ? null : delivery.error} WHERE id = ${saleId}`;
  const updated = await getSaleById(saleId);
  if (!updated) throw new Error("No se pudo actualizar el estado de envío de la factura.");
  return updated;
}

function responseError(body: Record<string, unknown>, status: number) {
  const errors = Array.isArray(body.errors) ? body.errors.map((error) => String(error)).join("; ") : "";
  return (errors || (typeof body.message === "string" ? body.message : `Lioren respondió con HTTP ${status}.`)).slice(0, 1000);
}

export async function issueLiorenInvoice(saleId: string, draftInput: unknown): Promise<SaleRecord> {
  const { configured, baseUrl } = getLiorenConfig();
  const token = process.env.LIOREN_API_TOKEN?.trim() ?? "";
  if (!configured) throw new Error("Configura LIOREN_API_BASE_URL y LIOREN_API_TOKEN en el servidor.");
  if (!/^https:\/\//i.test(baseUrl)) throw new Error("LIOREN_API_BASE_URL debe usar HTTPS.");
  if (!prisma) throw new Error("No hay conexión a la base de datos.");

  await ensureSalePaymentTable();
  const sale = await getSaleById(saleId);
  if (!sale) throw new Error("La venta no existe.");
  if (sale.archivedAt) throw new Error("No se puede facturar una venta oculta.");
  if (sale.status === "CANCELLED") throw new Error("No se puede facturar una venta cancelada.");
  if (sale.liorenInvoice.status === "ISSUED") throw new Error(`La venta ya tiene factura emitida${sale.liorenInvoice.folio ? ` (folio ${sale.liorenInvoice.folio})` : ""}.`);
  if (sale.liorenInvoice.status === "ISSUING") throw new Error("La factura de esta venta ya se está procesando.");

  const draft = validateLiorenInvoiceDraft(draftInput);
  assertInvoiceMatchesSale(draft, sale);
  const serializedDraft = JSON.stringify(draft);
  const claimed = await prisma.sale.updateMany({
    where: { id: sale.id, liorenInvoiceStatus: { in: ["NOT_ISSUED", "ERROR"] }, status: { not: "CANCELLED" } },
    data: {
      liorenInvoiceStatus: "ISSUING",
      liorenInvoiceType: draft.tipoDocumento,
      liorenInvoiceDraft: serializedDraft,
      liorenInvoiceError: null,
    },
  });
  if (claimed.count !== 1) throw new Error("No se pudo iniciar la emisión; actualiza la venta y revisa su estado de factura.");

  const idempotencyKey = createHash("sha256").update(`smartpro-sale:${sale.id}`).digest("hex");
  let issuedPdf: Buffer | null = null;
  try {
    const response = await fetch(`${baseUrl}/dtes`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Idempotency-Check": idempotencyKey,
      },
      body: JSON.stringify(liorenPayload(draft)),
      signal: AbortSignal.timeout(30_000),
      cache: "no-store",
    });
    const body = await response.json().catch(() => ({})) as Record<string, unknown>;
    const hasErrors = Array.isArray(body.errors) && body.errors.length > 0;
    if (!response.ok || hasErrors) throw new Error(responseError(body, response.status));

    issuedPdf = decodeLiorenInvoicePdf(body.pdf);

    await prisma.sale.update({
      where: { id: sale.id },
      data: {
        liorenInvoiceStatus: "ISSUED",
        liorenInvoiceDocumentId: Number.isSafeInteger(Number(body.id)) && Number(body.id) > 0 ? Number(body.id) : null,
        liorenInvoiceFolio: Number.isSafeInteger(Number(body.folio)) && Number(body.folio) > 0 ? Number(body.folio) : null,
        liorenInvoiceIssuedAt: new Date(),
        liorenInvoiceError: null,
      },
    });
    try {
      await prisma.$executeRaw`UPDATE Sale SET liorenInvoicePdf = ${issuedPdf?.toString("base64") ?? null}, liorenInvoiceEmailSentAt = NULL, liorenInvoiceEmailError = ${issuedPdf ? null : "Lioren emitió la factura, pero no devolvió el PDF solicitado."} WHERE id = ${sale.id}`;
    } catch (storageError) {
      console.error("Lioren emitió la factura, pero SmartPro no pudo guardar el PDF de la venta.", storageError);
      issuedPdf = null;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible emitir la factura en Lioren.";
    await prisma.sale.update({
      where: { id: sale.id },
      data: { liorenInvoiceStatus: "ERROR", liorenInvoiceError: message.slice(0, 1000) },
    });
    throw new Error(message);
  }

  let updated = await getSaleById(sale.id);
  if (!updated) throw new Error("Lioren emitió el documento, pero no se pudo actualizar la venta.");
  if (issuedPdf) {
    const delivery = await sendInvoicePdfEmail({ sale: updated, pdf: issuedPdf });
    await prisma.$executeRaw`UPDATE Sale SET liorenInvoiceEmailSentAt = ${delivery.delivered ? new Date() : null}, liorenInvoiceEmailError = ${delivery.delivered ? null : delivery.error} WHERE id = ${sale.id}`;
    updated = await getSaleById(sale.id);
    if (!updated) throw new Error("La factura se emitió, pero no se pudo actualizar el estado del correo.");
  }
  return updated;
}
