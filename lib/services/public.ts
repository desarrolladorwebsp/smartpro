import { mapServicePlansToPlans } from "./map-to-plan";
import { getPublicCatalogTree } from "./repository";
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

const SERVICE_COVERS: Record<string, string> = {
  "desarrollo-web": "/images/services/service-01.png",
  "campanas-publicitarias": "/images/services/service-02.png",
  "redes-sociales-contenido": "/images/services/service-03.png",
  "automatizacion-conversion": "/images/services/service-04.png",
  "produccion-audiovisual": "/images/services/service-05.png",
  "membresias-negocios": "/images/services/service-06.png",
  "negocio-completo": "/images/services/service-01.png",
};

export function getServiceCoverImage(slug: string, index: number): string {
  return SERVICE_COVERS[slug] ?? `/images/services/service-0${(index % 6) + 1}.png`;
}

export async function getPublicServicesForHome(): Promise<PublicServiceView[]> {
  const tree = await getPublicCatalogTree();

  return tree
    .map((service, index) => {
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
        image: getServiceCoverImage(service.slug, index),
        categories,
        plans: mapServicePlansToPlans(service.subcategories.flatMap((category) => category.plans)),
      };
    })
    .filter((service) => service.plans.length > 0);
}
