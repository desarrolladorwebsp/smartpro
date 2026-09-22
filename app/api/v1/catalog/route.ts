import { getScopedCatalogTree } from "@/lib/api/v1/catalog";
import { createApiPreflight, createApiRoute } from "@/lib/api/v1/handler";
import { presentCatalogTree } from "@/lib/api/v1/presenters";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const METHODS = ["GET"] as const;

export const GET = createApiRoute({
  scope: "catalog:read",
  methods: METHODS,
  handler: async ({ auth }) => {
    const services = presentCatalogTree(await getScopedCatalogTree(auth.client));

    return {
      data: { services },
      count: services.length,
    };
  },
});

export const OPTIONS = createApiPreflight(METHODS);
