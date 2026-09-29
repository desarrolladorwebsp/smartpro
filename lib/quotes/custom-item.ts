import { parseMoney, TAX_RATE } from "../orders/service";
import type { QuoteCustomItemInput, QuoteItemInput, QuoteItemRecord } from "./types";

export const CUSTOM_QUOTE_SERVICE_LABEL = "Servicio único";

const MAX_NAME_LENGTH = 120;
const MAX_ITEM_LENGTH = 180;
const MAX_ITEMS = 30;
const MAX_QUANTITY = 99;
const MAX_UNIT_PRICE = 100_000_000;
const MAX_LINES = 40;

function parseCatalogQuantity(value: unknown): number {
  const parsed = Math.trunc(Number(value) || 1);
  return Math.max(1, Number.isFinite(parsed) ? parsed : 1);
}

function parseCustomQuantity(value: unknown): number {
  if (value == null || value === "") {
    return 1;
  }

  const parsed = Math.trunc(Number(value));
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > MAX_QUANTITY) {
    throw new Error("La cantidad debe estar entre 1 y 99.");
  }

  return parsed;
}

export function parseIncludedFeatureList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new Error("Agrega los ítems del servicio único.");
  }

  const items: string[] = [];

  for (const entry of value) {
    const label = String(entry ?? "")
      .trim()
      .replace(/\s+/g, " ");
    if (!label) continue;
    if (label.length > MAX_ITEM_LENGTH) {
      throw new Error(`Cada ítem puede tener hasta ${MAX_ITEM_LENGTH} caracteres.`);
    }
    if (!items.some((existing) => existing.toLocaleLowerCase("es-CL") === label.toLocaleLowerCase("es-CL"))) {
      items.push(label);
    }
    if (items.length > MAX_ITEMS) {
      throw new Error(`El servicio único puede incluir hasta ${MAX_ITEMS} ítems.`);
    }
  }

  if (items.length === 0) {
    throw new Error("Agrega al menos un ítem al servicio único.");
  }

  return items;
}

export function parseCustomQuoteItemInput(input: {
  name?: unknown;
  unitPrice?: unknown;
  quantity?: unknown;
  includedItems?: unknown;
}): QuoteCustomItemInput {
  const name = String(input.name ?? "")
    .trim()
    .replace(/\s+/g, " ");

  if (!name) {
    throw new Error("Escribe el nombre del servicio único.");
  }

  if (name.length > MAX_NAME_LENGTH) {
    throw new Error(`El nombre del servicio único puede tener hasta ${MAX_NAME_LENGTH} caracteres.`);
  }

  const unitPrice = Math.round(parseMoney(input.unitPrice as string | number | null | undefined));
  if (!Number.isFinite(unitPrice) || unitPrice < 1) {
    throw new Error("El precio del servicio único debe ser mayor a 0.");
  }

  if (unitPrice > MAX_UNIT_PRICE) {
    throw new Error("El precio del servicio único es demasiado alto.");
  }

  return {
    kind: "custom",
    name,
    unitPrice,
    quantity: parseCustomQuantity(input.quantity),
    includedItems: parseIncludedFeatureList(input.includedItems),
  };
}

export function parseQuoteItemInputs(value: unknown): QuoteItemInput[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("Selecciona al menos un plan o servicio.");
  }

  if (value.length > MAX_LINES) {
    throw new Error("La cotización tiene demasiados servicios.");
  }

  return value.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error("Uno de los servicios de la cotización no es válido.");
    }

    const record = entry as {
      planId?: unknown;
      quantity?: unknown;
      name?: unknown;
      unitPrice?: unknown;
      includedItems?: unknown;
    };
    const planId = String(record.planId ?? "").trim();

    if (planId) {
      if (planId.length > 191) {
        throw new Error("Uno de los planes seleccionados no es válido.");
      }

      return {
        kind: "catalog" as const,
        planId,
        quantity: parseCatalogQuantity(record.quantity),
      };
    }

    return parseCustomQuoteItemInput(record);
  });
}

export function buildCustomQuoteItemRecord(input: QuoteCustomItemInput, sortOrder: number): QuoteItemRecord {
  const parsed = parseCustomQuoteItemInput(input);
  const subtotal = parsed.unitPrice * parsed.quantity;
  const tax = subtotal * TAX_RATE;

  return {
    id: "",
    planId: null,
    planName: parsed.name,
    categoryName: CUSTOM_QUOTE_SERVICE_LABEL,
    subcategoryName: "",
    quantity: parsed.quantity,
    unitPrice: parsed.unitPrice,
    taxRate: TAX_RATE,
    includedItems: parsed.includedItems,
    subtotal,
    tax,
    total: subtotal + tax,
    sortOrder,
  };
}
