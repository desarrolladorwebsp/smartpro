import { createApiPreflight, createApiRoute } from "@/lib/api/v1/handler";
import { presentSale } from "@/lib/api/v1/presenters";
import { registerExternalSale } from "@/lib/api/v1/sales";
import { listSalesByApiClientId } from "@/lib/sales/repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const METHODS = ["GET", "POST"] as const;

export const GET = createApiRoute({
  scope: "sales:read",
  methods: METHODS,
  requireSecret: true,
  handler: async ({ auth }) => {
    const sales = await listSalesByApiClientId(auth.client.id);

    return { data: { sales: sales.map(presentSale) }, count: sales.length };
  },
});

export const POST = createApiRoute({
  scope: "sales:write",
  methods: METHODS,
  requireSecret: true,
  requireIdempotency: true,
  handler: async ({ auth, body }) => {
    const result = await registerExternalSale(auth.client, body);

    return {
      data: {
        sale: presentSale(result.sale),
        duplicate: result.duplicate,
      },
      status: result.duplicate ? 200 : 201,
    };
  },
});

export const OPTIONS = createApiPreflight(METHODS);
