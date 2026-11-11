import { formatCurrency } from "../orders/service";

export const PAYMENT_MODES = {
  ONE_TIME: "Pago único",
  RENEWABLE: "Mensual renovable",
  INSTALLMENTS: "Cuotas mensuales",
  ANNUAL: "Plan anual con pago mensual",
} as const;

export type PaymentMode = keyof typeof PAYMENT_MODES;
export type InstallmentType = "FIXED" | "VARIABLE";
export type PaymentSetup = {
  mode: PaymentMode;
  months: number | null;
  firstPayment: number | null;
  installmentType?: InstallmentType;
  endDate?: string;
};
export const ONE_TIME_PAYMENT: PaymentSetup = { mode: "ONE_TIME", months: null, firstPayment: null };
export type PaymentSchedule = PaymentSetup & { amounts: number[]; recurringAmount: number | null };
export type ProposalBlock = { title: string; description: string };
export type QuoteProposal = {
  showExpiration: boolean;
  showDelivery: boolean;
  showDeposit: boolean;
  blocks: ProposalBlock[];
  payments: PaymentSchedule[];
};

export const MAX_PROPOSAL_BLOCKS = 10;
export const MAX_BLOCK_TITLE = 120;
export const MAX_BLOCK_DESCRIPTION = 1500;
export const MAX_PAYMENT_MONTHS = 120;
export const PAYMENT_SETUP_NOTICE = "El cobro se coordinará después de aceptar la cotización.";

function record(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("La configuración de la cotización no es válida.");
  }
  return value as Record<string, unknown>;
}

function readFlag(value: unknown): boolean {
  if (typeof value !== "boolean") throw new Error("Las opciones de visibilidad no son válidas.");
  return value;
}

function parseInstallmentAmounts(value: unknown, count: number, total: number): number[] {
  if (!Array.isArray(value) || value.length !== count) {
    throw new Error("Ingresa el monto de cada cuota variable.");
  }
  const amounts = Array.from(value, (entry) => {
    const amount = typeof entry === "number" || (typeof entry === "string" && /^\d+$/.test(entry))
      ? Number(entry)
      : NaN;
    if (!Number.isSafeInteger(amount) || amount < 1) {
      throw new Error("Cada cuota variable debe tener un monto positivo en pesos.");
    }
    return amount;
  });
  if (amounts.reduce((sum, amount) => sum + amount, 0) !== total) {
    throw new Error(`Las cuotas variables deben sumar ${formatCurrency(total)} con IVA.`);
  }
  return amounts;
}

function parseLegacyEndDate(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T00:00:00Z`);
    if (!Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value) return value;
  }
  throw new Error("La fecha de término guardada no es válida.");
}

export function buildPaymentSchedule(input: unknown, total: number): PaymentSchedule {
  const value = record(input);
  const mode = value.mode;
  if (mode === "ONE_TIME") return { ...ONE_TIME_PAYMENT, amounts: [total], recurringAmount: null };
  if (mode !== "RENEWABLE" && mode !== "INSTALLMENTS" && mode !== "ANNUAL") {
    throw new Error("Selecciona una modalidad de pago válida.");
  }
  const firstPayment = value.firstPayment == null || value.firstPayment === "" ? null : Number(value.firstPayment);
  if (firstPayment !== null && (!Number.isSafeInteger(firstPayment) || firstPayment < 1 || firstPayment > 999_999_999)) {
    throw new Error("La primera cuota debe ser un monto válido en pesos.");
  }
  if (mode === "RENEWABLE") {
    if (total < 1) throw new Error("La mensualidad debe ser mayor a cero.");
    return { mode, months: null, firstPayment, amounts: [firstPayment ?? total], recurringAmount: total };
  }

  const months = mode === "ANNUAL" ? 12 : Number(value.months);
  if (!Number.isInteger(months) || months < 2 || months > MAX_PAYMENT_MONTHS) {
    throw new Error(`Ingresa entre 2 y ${MAX_PAYMENT_MONTHS} cuotas.`);
  }
  if (value.installmentType === "VARIABLE") {
    const amounts = parseInstallmentAmounts(value.installmentAmounts, months, total);
    return { mode, months, installmentType: "VARIABLE", firstPayment: null, amounts, recurringAmount: null };
  }
  if (value.installmentType !== undefined && value.installmentType !== "FIXED") {
    throw new Error("Selecciona cuotas fijas o variables.");
  }

  const legacyFirstPayment = value.installmentType === undefined ? firstPayment : null;
  const count = legacyFirstPayment === null ? months : months - 1;
  const balance = total - (legacyFirstPayment ?? 0);
  if (balance < count) {
    throw new Error("El total y la primera cuota deben dejar al menos $1 para cada cuota restante.");
  }
  const regular = Math.floor(balance / count);
  const extra = balance % count;
  const amounts = Array.from({ length: count }, (_, i) => regular + (i >= count - extra ? 1 : 0));
  if (legacyFirstPayment !== null) amounts.unshift(legacyFirstPayment);
  const endDate = value.installmentType === undefined ? parseLegacyEndDate(value.endDate) : undefined;
  return {
    mode, months, firstPayment: legacyFirstPayment, amounts, recurringAmount: null,
    ...(value.installmentType === "FIXED" ? { installmentType: value.installmentType } : {}),
    ...(endDate ? { endDate } : {}),
  };
}

// Allocate the rounded quote total proportionally, including the global discount and IVA.
export function allocatePaymentTotals(lineTotals: number[], quoteTotal: number): number[] {
  const gross = lineTotals.reduce((sum, amount) => sum + amount, 0);
  let running = 0;
  let allocated = 0;
  return lineTotals.map((amount, index) => {
    running += amount;
    const target = index === lineTotals.length - 1
      ? Math.round(quoteTotal)
      : gross > 0 ? Math.round(quoteTotal * running / gross) : 0;
    const share = target - allocated;
    allocated = target;
    return share;
  });
}

export function buildQuoteProposal(input: unknown, lineTotals: number[], total: number): QuoteProposal {
  const value = record(input);
  if (!Array.isArray(value.blocks) || value.blocks.length > MAX_PROPOSAL_BLOCKS) {
    throw new Error(`La cotización admite hasta ${MAX_PROPOSAL_BLOCKS} bloques.`);
  }
  const blocks = value.blocks.flatMap((entry) => {
    const { title, description } = record(entry);
    if (typeof title !== "string" || typeof description !== "string") {
      throw new Error("Cada bloque debe tener título y descripción.");
    }
    const block = { title: title.trim(), description: description.trim() };
    if (!block.title && !block.description) return [];
    if (!block.title || !block.description) throw new Error("Completa el título y la descripción de cada bloque.");
    if (block.title.length > MAX_BLOCK_TITLE || block.description.length > MAX_BLOCK_DESCRIPTION) {
      throw new Error("El título o la descripción superan el largo permitido.");
    }
    return [block];
  });
  const payments = value.payments;
  if (!Array.isArray(payments) || payments.length !== lineTotals.length) {
    throw new Error("Configura una modalidad de pago para cada servicio.");
  }
  return {
    showExpiration: readFlag(value.showExpiration),
    showDelivery: readFlag(value.showDelivery),
    showDeposit: readFlag(value.showDeposit),
    blocks,
    payments: allocatePaymentTotals(lineTotals, total).map((amount, index) => buildPaymentSchedule(payments[index], amount)),
  };
}

export function paymentScheduleText(schedule: PaymentSchedule): string {
  if (schedule.mode === "ONE_TIME") return `Pago único de ${formatCurrency(schedule.amounts[0])}.`;
  if (schedule.mode === "RENEWABLE") {
    return `Mes 1: ${formatCurrency(schedule.amounts[0])}. Desde el mes 2: ${formatCurrency(schedule.recurringAmount ?? 0)} al mes. Mensual renovable por tiempo indefinido.`;
  }
  const isLegacy = schedule.installmentType === undefined;
  const groups: string[] = [];
  for (let start = 0; start < schedule.amounts.length;) {
    const amount = schedule.amounts[start];
    let end = start + 1;
    while (end < schedule.amounts.length && schedule.amounts[end] === amount) end += 1;
    const label = end === start + 1
      ? `${isLegacy ? "Mes" : "Cuota"} ${end}`
      : `${isLegacy ? "Meses" : "Cuotas"} ${start + 1} a ${end}`;
    groups.push(`${label}: ${formatCurrency(amount)}${end > start + 1 ? " c/u" : ""}`);
    start = end;
  }
  if (isLegacy) {
    const endDate = schedule.endDate
      ? ` Fecha de término: ${new Intl.DateTimeFormat("es-CL", { dateStyle: "long", timeZone: "UTC" })
        .format(new Date(`${schedule.endDate}T00:00:00Z`))}.`
      : "";
    return `${PAYMENT_MODES[schedule.mode]} (${schedule.months} meses).${endDate} ${groups.join(" · ")}.`;
  }
  const isVariable = schedule.installmentType === "VARIABLE";
  const label = schedule.mode === "ANNUAL" ? "Plan anual en" : "Pago en";
  return `${label} ${schedule.months} cuotas ${isVariable ? "variables" : "fijas"}. ${groups.join(" · ")}.`;
}

export function proposalHasRenewal(proposal: QuoteProposal | null | undefined): boolean {
  return proposal?.payments.some((payment) => payment.mode === "RENEWABLE") ?? false;
}
