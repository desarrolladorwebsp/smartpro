import { ApiError } from "@/lib/api/v1/errors";
import { createApiPreflight, createApiRoute } from "@/lib/api/v1/handler";
import { presentSale } from "@/lib/api/v1/presenters";
import { getOrderRecord } from "@/lib/orders/repository";
import { getSaleById } from "@/lib/sales/repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const METHODS = ["GET"] as const;

export const GET = createApiRoute<{ id: string }>({
  scope: "sales:read",
  methods: METHODS,
  requireSecret: true,
  handler: async ({ auth, params }) => {
    const sale = await getSaleById(String(params.id ?? "").trim());

    // Una venta ajena se responde como inexistente para no filtrar la
    // existencia de ventas de otras aplicaciones ni del sitio principal.
    const notFound = new ApiError("resource_not_found", "La venta no existe.");

    if (!sale) {
      throw notFound;
    }

    if (sale.apiClientId !== auth.client.id) {
      const order = sale.orderId ? await getOrderRecord(sale.orderId) : null;

      if (order?.apiClientId !== auth.client.id) {
        throw notFound;
      }
    }

    return { data: { sale: presentSale(sale) } };
  },
});

export const OPTIONS = createApiPreflight(METHODS);
