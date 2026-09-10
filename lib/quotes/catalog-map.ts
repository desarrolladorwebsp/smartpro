import type { CatalogTree } from "../services/types";
import type { QuoteCatalogGroup, QuoteCatalogPlan } from "./types";

export function mapCatalogTreeToQuoteGroups(tree: CatalogTree): QuoteCatalogGroup[] {
  return tree
    .map((category) => {
      const plans: QuoteCatalogPlan[] = category.subcategories.flatMap((subcategory) =>
        subcategory.plans
          .filter((plan) => plan.status === "ACTIVE")
          .map((plan) => ({
            id: plan.id,
            name: plan.name,
            categoryId: category.id,
            categoryName: category.name,
            subcategoryId: subcategory.id,
            subcategoryName: subcategory.name,
            price: plan.price,
            taxRate: plan.taxRate,
            taxLabel: plan.taxLabel,
            summary: plan.summary,
            items: plan.items.filter((item) => item.status === "ACTIVE").map((item) => item.label).filter(Boolean),
          })),
      );

      return {
        id: category.id,
        name: category.name,
        plans,
      };
    })
    .filter((group) => group.plans.length > 0);
}
