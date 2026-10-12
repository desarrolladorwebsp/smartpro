import { roundClp } from "./balances";
import { withSalePaymentTotals, type SalePaymentMethod, type SaleRecord } from "./types";

export type SalesDebtor = {
  clientId: string;
  clientCompany: string;
  clientName: string;
  balanceDue: number;
  saleCount: number;
};

export type SalesSummary = {
  soldTotal: number;
  soldMonth: number;
  collectedMonth: number;
  receivableTotal: number;
  collectedByMethod: Partial<Record<SalePaymentMethod, number>>;
  debtors: SalesDebtor[];
};

export type SalesPeriod = {
  year: number;
  month: number;
};

const SALES_TIME_ZONE = "America/Santiago";
const SALES_PERIOD_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: SALES_TIME_ZONE,
  year: "numeric",
  month: "numeric",
});

function getPeriodFromDate(date: Date): SalesPeriod {
  const parts = SALES_PERIOD_FORMATTER.formatToParts(date);
  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
  };
}

function isCancelled(sale: Pick<SaleRecord, "status">) {
  return sale.status === "CANCELLED";
}

function inMonth(iso: string, period: SalesPeriod) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  const salePeriod = getPeriodFromDate(date);
  return salePeriod.year === period.year && salePeriod.month === period.month;
}

export function buildSalesSummary(sales: SaleRecord[], now = new Date(), selectedPeriod?: SalesPeriod): SalesSummary {
  const period = selectedPeriod ?? getPeriodFromDate(now);
  const active = sales.filter((sale) => !isCancelled(sale)).map(withSalePaymentTotals);
  const collectedByMethod: Partial<Record<SalePaymentMethod, number>> = {};
  let collectedMonth = 0;

  for (const sale of active) {
    for (const payment of sale.payments ?? []) {
      if (!inMonth(payment.paidAt, period)) continue;
      collectedMonth += roundClp(payment.amount);
      collectedByMethod[payment.method] = (collectedByMethod[payment.method] ?? 0) + roundClp(payment.amount);
    }
  }

  const debtorMap = new Map<string, SalesDebtor>();
  for (const sale of active) {
    if (sale.balanceDue <= 0) continue;
    const existing = debtorMap.get(sale.clientId);
    if (existing) {
      existing.balanceDue += sale.balanceDue;
      existing.saleCount += 1;
      continue;
    }
    debtorMap.set(sale.clientId, {
      clientId: sale.clientId,
      clientCompany: sale.clientCompany,
      clientName: sale.clientName,
      balanceDue: sale.balanceDue,
      saleCount: 1,
    });
  }

  return {
    soldTotal: active.reduce((sum, sale) => sum + roundClp(sale.total), 0),
    soldMonth: active.filter((sale) => inMonth(sale.soldAt, period)).reduce((sum, sale) => sum + roundClp(sale.total), 0),
    collectedMonth,
    receivableTotal: active.reduce((sum, sale) => sum + sale.balanceDue, 0),
    collectedByMethod,
    debtors: [...debtorMap.values()].sort((a, b) => b.balanceDue - a.balanceDue),
  };
}

export function summarizeFilteredSales(sales: SaleRecord[]) {
  const active = sales.filter((sale) => !isCancelled(sale)).map(withSalePaymentTotals);
  return {
    sold: active.reduce((sum, sale) => sum + roundClp(sale.total), 0),
    collected: active.reduce((sum, sale) => sum + sale.paidAmount, 0),
    receivable: active.reduce((sum, sale) => sum + sale.balanceDue, 0),
  };
}
