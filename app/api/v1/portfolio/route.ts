import { createApiPreflight, createApiRoute } from "@/lib/api/v1/handler";
import { listScopedPortfolioProjects } from "@/lib/api/v1/portfolio";
import { presentPortfolioProject } from "@/lib/api/v1/presenters";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const METHODS = ["GET"] as const;

export const GET = createApiRoute({
  scope: "portfolio:read",
  methods: METHODS,
  handler: async ({ auth, searchParams }) => {
    const projects = await listScopedPortfolioProjects(auth.client, {
      serviceSlug: searchParams.get("service"),
    });

    return { data: { projects: projects.map(presentPortfolioProject) }, count: projects.length };
  },
});

export const OPTIONS = createApiPreflight(METHODS);
