import { listScopedPlans } from "@/lib/api/v1/catalog";
import { createApiPreflight, createApiRoute } from "@/lib/api/v1/handler";
import { presentPlan } from "@/lib/api/v1/presenters";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const METHODS = ["GET"] as const;

export const GET = createApiRoute({
  scope: "catalog:read",
  methods: METHODS,
  handler: async ({ auth, searchParams }) => {
    const plans = await listScopedPlans(auth.client, {
      serviceSlug: searchParams.get("service"),
      categorySlug: searchParams.get("category"),
    });

    return { data: { plans: plans.map(presentPlan) }, count: plans.length };
  },
});

export const OPTIONS = createApiPreflight(METHODS);
