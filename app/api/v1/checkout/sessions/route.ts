import { createCheckoutSession } from "@/lib/api/v1/checkout";
import { createApiPreflight, createApiRoute } from "@/lib/api/v1/handler";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const METHODS = ["POST"] as const;

export const POST = createApiRoute({
  scope: "checkout:write",
  methods: METHODS,
  requireSecret: true,
  requireIdempotency: true,
  handler: async ({ auth, body }) => {
    const result = await createCheckoutSession(auth.client, body);

    return {
      data: result,
      status: 201,
    };
  },
});

export const OPTIONS = createApiPreflight(METHODS);
