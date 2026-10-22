import { requireAdminSession } from "@/lib/auth";
import { getSaleReceiptMedia } from "@/lib/sales/receipt";
import { saleReceiptResponse } from "@/lib/sales/receipt-response";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return saleReceiptResponse(params, { requireSession: requireAdminSession, loadReceipt: getSaleReceiptMedia });
}
