import { getScopedService } from "@/lib/api/v1/catalog";
import { createApiPreflight, createApiRoute } from "@/lib/api/v1/handler";
import { presentCatalogTree } from "@/lib/api/v1/presenters";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const METHODS = ["GET"] as const;

export const GET = createApiRoute<{ slug: string }>({
  scope: "catalog:read",
  methods: METHODS,
  handler: async ({ auth, params }) => {
    const service = await getScopedService(auth.client, params.slug);
    const [presented] = presentCatalogTree([service]);

    return { data: { service: presented } };
  },
});

export const OPTIONS = createApiPreflight(METHODS);
