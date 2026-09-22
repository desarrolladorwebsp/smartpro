import { createApiPreflight, createApiRoute } from "@/lib/api/v1/handler";
import { registerLead } from "@/lib/api/v1/leads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const METHODS = ["POST"] as const;

export const POST = createApiRoute({
  scope: "leads:write",
  methods: METHODS,
  requireSecret: true,
  requireIdempotency: true,
  handler: async ({ auth, body }) => {
    const lead = await registerLead(auth.client, body);

    return { data: { lead }, status: lead.created ? 201 : 200 };
  },
});

export const OPTIONS = createApiPreflight(METHODS);
