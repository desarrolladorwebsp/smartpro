import type { CustomerOrder } from "../orders/repository";

export type MercadoPagoPaymentStatus =
  | "pending"
  | "approved"
  | "authorized"
  | "in_process"
  | "in_mediation"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "charged_back";

export type MappedPaymentState = {
  paymentStatus: CustomerOrder["paymentStatus"];
  orderStatus: CustomerOrder["orderStatus"];
};

export function mapMercadoPagoStatus(status: string | null | undefined): MappedPaymentState {
  switch (String(status ?? "").trim().toLowerCase()) {
    case "approved":
      return { paymentStatus: "paid", orderStatus: "confirmed" };
    case "rejected":
      return { paymentStatus: "failed", orderStatus: "cancelled" };
    case "cancelled":
    case "refunded":
    case "charged_back":
      return { paymentStatus: "cancelled", orderStatus: "cancelled" };
    case "pending":
    case "authorized":
    case "in_process":
    case "in_mediation":
      return { paymentStatus: "pending", orderStatus: "pending" };
    default:
      return { paymentStatus: "pending", orderStatus: "pending" };
  }
}

export function canTransitionPaymentStatus(
  current: CustomerOrder["paymentStatus"],
  next: CustomerOrder["paymentStatus"],
): boolean {
  if (current === next) {
    return true;
  }

  if (current === "paid") {
    return next === "cancelled";
  }

  return true;
}

export function checkoutResultStatus(paymentStatus: CustomerOrder["paymentStatus"]): "approved" | "pending" | "failed" | "cancelled" {
  if (paymentStatus === "paid") return "approved";
  if (paymentStatus === "pending") return "pending";
  if (paymentStatus === "cancelled") return "cancelled";
  return "failed";
}
