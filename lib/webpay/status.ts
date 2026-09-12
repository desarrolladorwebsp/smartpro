import type { CustomerOrder } from "../orders/repository";

export type WebpayCommitSnapshot = {
  token: string;
  buy_order?: string;
  session_id?: string;
  amount?: number;
  status?: string;
  response_code?: number;
};

function readString(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function toWebpayAmount(total: number): number {
  const amount = Math.round(total);
  if (!Number.isFinite(amount) || amount < 1) {
    throw new Error("El monto de Webpay no es válido.");
  }
  return amount;
}

export function toWebpayCommitSnapshot(token: string, response: Record<string, unknown>): WebpayCommitSnapshot {
  return {
    token,
    buy_order: readString(response.buy_order ?? response.buyOrder),
    session_id: readString(response.session_id ?? response.sessionId),
    amount: toOptionalNumber(response.amount),
    status: readString(response.status),
    response_code: toOptionalNumber(response.response_code ?? response.responseCode),
  };
}

export function isWebpayApproved(snapshot: Pick<WebpayCommitSnapshot, "response_code" | "status">): boolean {
  return snapshot.response_code === 0 && String(snapshot.status ?? "").toUpperCase() === "AUTHORIZED";
}

export function amountsMatch(orderTotal: number, transactionAmount: number | undefined): boolean {
  if (typeof transactionAmount !== "number" || !Number.isFinite(transactionAmount)) {
    return false;
  }

  return Math.round(orderTotal) === Math.round(transactionAmount);
}

export function checkoutResultFromWebpayKind(
  kind: "commit" | "aborted" | "timeout" | "error",
  approved: boolean,
): "approved" | "failed" | "cancelled" {
  if (kind === "commit" && approved) return "approved";
  if (kind === "aborted" || kind === "timeout") return "cancelled";
  return "failed";
}

export function checkoutResultStatus(
  paymentStatus: CustomerOrder["paymentStatus"],
): "approved" | "pending" | "failed" | "cancelled" {
  if (paymentStatus === "paid") return "approved";
  if (paymentStatus === "pending") return "pending";
  if (paymentStatus === "cancelled") return "cancelled";
  return "failed";
}
