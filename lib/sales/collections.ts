import { calendarToday, parseCalendarDate } from "../calendar-slots";
import { roundClp } from "./balances";

export type CollectionMode = "SINGLE" | "INSTALLMENTS";
export type CollectionDue = {
  id: string;
  sequence: number;
  dueOn: string;
  amount: number;
  remaining: number;
  status: "PAID" | "UPCOMING" | "DUE" | "OVERDUE";
};

export type SaleCollection = {
  saleId: string;
  saleNumber: string;
  clientName: string;
  balanceDue: number;
  paidAmount: number;
  canSchedule: boolean;
  hasInstallments: boolean;
  installmentAmounts: number[];
  suggestedDate: string | null;
  firstDueOn: string | null;
  mode: CollectionMode | null;
  installments: CollectionDue[];
};

export type CalendarCollectionDue = CollectionDue & {
  saleId: string;
  saleNumber: string;
  clientName: string;
  clientKey: string;
  executiveId: string | null;
  executiveName: string | null;
};

export type SaleCollectionSummary = { nextDue: CollectionDue | null };

type ScheduledAmount = Pick<CollectionDue, "id" | "sequence" | "dueOn" | "amount">;

export function collectionInstallmentAmounts(proposal: unknown, saleTotal: number): number[] {
  const payments = (proposal as { payments?: unknown } | null)?.payments;
  if (!Array.isArray(payments) || payments.length === 0) return [];

  const installments: number[] = [];
  for (const payment of payments) {
    if (!payment || !["ONE_TIME", "INSTALLMENTS", "ANNUAL"].includes(payment.mode) ||
        !Array.isArray(payment.amounts) || payment.amounts.length === 0 || payment.amounts.length > 120 ||
        (payment.mode === "ONE_TIME" && payment.amounts.length !== 1)) return [];
    for (const [index, amount] of payment.amounts.entries()) {
      if (!Number.isSafeInteger(amount) || amount < 0) return [];
      installments[index] = (installments[index] ?? 0) + amount;
    }
  }
  return installments.length > 1 && installments.every((amount) => amount > 0) &&
    installments.reduce((total, amount) => total + amount, 0) === roundClp(saleTotal)
    ? installments : [];
}

export function allocateCollectionDues(dues: ScheduledAmount[], paidAmount: number, today = calendarToday()): CollectionDue[] {
  let credit = Math.max(0, roundClp(paidAmount));
  return [...dues].sort((a, b) => a.dueOn.localeCompare(b.dueOn) || a.sequence - b.sequence).map((due) => {
    const applied = Math.min(due.amount, credit);
    credit -= applied;
    const remaining = due.amount - applied;
    const status = remaining === 0 ? "PAID" : due.dueOn < today ? "OVERDUE" : due.dueOn === today ? "DUE" : "UPCOMING";
    return { ...due, remaining, status };
  });
}

export function buildCollectionPreview(
  firstDueOn: string,
  amounts: number[],
  paidAmount: number,
  today = calendarToday(),
): CollectionDue[] {
  const first = parseCalendarDate(firstDueOn);
  if (!first) throw new Error("Ingresa una fecha válida para el primer vencimiento.");
  if (amounts.length === 0 || amounts.length > 120 || amounts.some((amount) => !Number.isSafeInteger(amount) || amount < 1)) {
    throw new Error("Los montos de cobro deben ser valores positivos en pesos.");
  }
  if (first.getUTCFullYear() * 12 + first.getUTCMonth() + amounts.length > 10000 * 12) {
    throw new Error("La fecha del último vencimiento queda fuera del rango permitido.");
  }

  const dues = amounts.map((amount, index) => {
    const year = first.getUTCFullYear();
    const month = first.getUTCMonth() + index;
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const dueOn = new Date(Date.UTC(year, month, Math.min(first.getUTCDate(), lastDay))).toISOString().slice(0, 10);
    return { id: `preview-${index + 1}`, sequence: index + 1, dueOn, amount };
  });
  return allocateCollectionDues(dues, paidAmount, today);
}
