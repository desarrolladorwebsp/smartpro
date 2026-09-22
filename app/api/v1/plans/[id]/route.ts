import { getScopedPlan } from "@/lib/api/v1/catalog";
import { createApiPreflight, createApiRoute } from "@/lib/api/v1/handler";
import { presentPlan } from "@/lib/api/v1/presenters";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const METHODS = ["GET"] as const;

export const GET = createApiRoute<{ id: string }>({
  scope: "catalog:read",
  methods: METHODS,
  handler: async ({ auth, params }) => ({
    data: { plan: presentPlan(await getScopedPlan(auth.client, params.id)) },
  }),
});

export const OPTIONS = createApiPreflight(METHODS);
