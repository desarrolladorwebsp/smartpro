import { ApiError } from "@/lib/api/v1/errors";
import { createApiPreflight, createApiRoute } from "@/lib/api/v1/handler";
import { presentCheckoutSession, presentSale } from "@/lib/api/v1/presenters";
import { retryPendingApiWebhooks } from "@/lib/api/v1/webhooks";
import { getOrderRecord } from "@/lib/orders/repository";
import { getSaleByOrderId } from "@/lib/sales/repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const METHODS = ["GET"] as const;

export const GET = createApiRoute<{ orderId: string }>({
  scope: "orders:read",
  methods: METHODS,
  requireSecret: true,
  handler: async ({ auth, params }) => {
    const orderId = String(params.orderId ?? "").trim();
    const order = orderId ? await getOrderRecord(orderId) : null;

    // Una orden de otra aplicación se responde como inexistente para no
    // filtrar la existencia de órdenes ajenas.
    if (!order || order.apiClientId !== auth.client.id) {
      throw new ApiError("resource_not_found", "La sesión de pago no existe.");
    }

    // Aprovechamos la consulta para reintentar webhooks pendientes, que es
    // justo cuando el sitio satélite está esperando la confirmación.
    void retryPendingApiWebhooks();

    const sale = order.paymentStatus === "paid" ? await getSaleByOrderId(order.id) : null;

    return {
      data: {
        session: presentCheckoutSession(order),
        sale: sale ? presentSale(sale) : null,
      },
    };
  },
});

export const OPTIONS = createApiPreflight(METHODS);
