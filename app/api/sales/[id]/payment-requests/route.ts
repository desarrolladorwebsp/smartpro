import { z } from "zod";

import { requireAdminSession } from "@/lib/auth";
import { changePaymentRequest, createPaymentRequest, listPaymentRequests, PaymentRequestError, refreshPaymentRequest, validPaymentRequestToken } from "@/lib/sales/payment-requests";

type Context = { params: Promise<{ id: string }> };
const token = z.string().refine(validPaymentRequestToken);
const input = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), amount: z.string().max(30), key: z.string().uuid() }),
  z.object({ action: z.literal("cancel"), id: token }),
  z.object({ action: z.literal("resend"), id: token, key: z.string().uuid() }),
  z.object({ action: z.literal("refresh"), id: token }),
]);

function respond(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

async function withSale(context: Context, fn: (id: string, session: Awaited<ReturnType<typeof requireAdminSession>>) => Promise<unknown>) {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return respond({ error: "Inicia sesión para gestionar solicitudes de abono." }, 401);
  try {
    return respond(await fn((await context.params).id, session));
  } catch (error) {
    if (error instanceof PaymentRequestError) return respond({ error: error.message }, error.status);
    console.error("[smartpro:abono] No se pudo gestionar la solicitud.");
    return respond({ error: "No se pudo gestionar la solicitud de abono." }, 500);
  }
}

export function GET(_request: Request, context: Context) {
  return withSale(context, listPaymentRequests);
}

export function POST(request: Request, context: Context) {
  return withSale(context, async (id, session) => {
    const parsed = input.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new PaymentRequestError("Revisa los datos de la solicitud.");
    const data = parsed.data;
    if (data.action === "create") return createPaymentRequest(id, session, data);
    if (data.action === "refresh") return refreshPaymentRequest(id, session, data.id);
    return changePaymentRequest(id, session, data);
  });
}
