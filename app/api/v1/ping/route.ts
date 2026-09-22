import { createApiPreflight, createApiRoute } from "@/lib/api/v1/handler";
import { API_VERSION } from "@/lib/api/v1/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const METHODS = ["GET"] as const;

export const GET = createApiRoute({
  scope: "catalog:read",
  methods: METHODS,
  handler: async ({ auth }) => ({
    data: {
      ok: true,
      apiVersion: API_VERSION,
      credential: auth.credential,
      client: {
        name: auth.client.name,
        slug: auth.client.slug,
        scopes: auth.client.scopes,
        allowedServiceIds: auth.client.allowedServiceIds,
        allowedReturnUrls: auth.client.allowedReturnUrls,
        webhookConfigured: Boolean(auth.client.webhookUrl),
        rateLimitPerMinute: auth.client.rateLimitPerMinute,
      },
      serverTime: new Date().toISOString(),
    },
  }),
});

export const OPTIONS = createApiPreflight(METHODS);
