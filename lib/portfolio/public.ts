import { getPublicPortfolioCategory } from "./constants";
import { listPortfolioProjects } from "./repository";
import type { PublicPortfolioProject } from "./types";

export async function getPublicPortfolioProjects(): Promise<PublicPortfolioProject[]> {
  const projects = await listPortfolioProjects({ status: "PUBLISHED" });

  return projects.flatMap((project) => {
    const category =
      project.publicCategory ?? getPublicPortfolioCategory(project.subcategorySlug, project.subcategoryName);

    if (!project.image || !category) {
      return [];
    }

    return [
      {
        id: project.id,
        title: project.title,
        summary: project.summary,
        category,
        image: project.image,
        url: project.url,
        tags: project.tags,
      },
    ];
  });
}
