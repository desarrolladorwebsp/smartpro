import { mapServicePlansToPlans } from "./map-to-plan";
import { resolveServiceCoverImage } from "./default-covers";
import { getPublicCatalogTree } from "./repository";
import type { CatalogTree } from "./types";
import type { Plan } from "@/components/plans/PlanCard";

export type PublicCategoryFilter = {
  id: string;
  name: string;
  slug: string;
};

export type PublicServiceView = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  categories: PublicCategoryFilter[];
  plans: Plan[];
};

export function mapCatalogTreeToPublicServices(tree: CatalogTree): PublicServiceView[] {
  return tree.map((service, index) => {
    const categories = service.subcategories
      .filter((category) => category.plans.length > 0)
      .map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
      }));

    return {
      id: service.id,
      name: service.name,
      slug: service.slug,
      description: service.description,
      image: resolveServiceCoverImage(service.coverImage, service.slug, index),
      categories,
      plans: mapServicePlansToPlans(service.subcategories.flatMap((category) => category.plans)),
    };
  });
}

export async function getPublicServicesForHome(): Promise<PublicServiceView[]> {
  const tree = await getPublicCatalogTree();
  return mapCatalogTreeToPublicServices(tree);
}
