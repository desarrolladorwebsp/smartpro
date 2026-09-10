import type { CatalogTree } from "../services/types";

export type ClientInterestInput = {
  interestServiceId?: string | null;
  interestSubcategoryId?: string | null;
  interestPlanId?: string | null;
};

export type ClientInterestSnapshot = {
  interestServiceId: string | null;
  interestServiceName: string;
  interestSubcategoryId: string | null;
  interestSubcategoryName: string;
  interestPlanId: string | null;
  interestPlanName: string;
};

export type ClientInterestCatalogService = {
  id: string;
  name: string;
  categories: Array<{
    id: string;
    name: string;
    plans: Array<{
      id: string;
      name: string;
    }>;
  }>;
};

export function emptyClientInterest(): ClientInterestSnapshot {
  return {
    interestServiceId: null,
    interestServiceName: "",
    interestSubcategoryId: null,
    interestSubcategoryName: "",
    interestPlanId: null,
    interestPlanName: "",
  };
}

export function formatClientInterestLabel(interest: Pick<
  ClientInterestSnapshot,
  "interestServiceName" | "interestSubcategoryName" | "interestPlanName"
>): string {
  return [interest.interestServiceName, interest.interestSubcategoryName, interest.interestPlanName]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(" / ");
}

export function mapCatalogTreeToInterestCatalog(tree: CatalogTree): ClientInterestCatalogService[] {
  return tree.map((service) => ({
    id: service.id,
    name: service.name,
    categories: service.subcategories.map((category) => ({
      id: category.id,
      name: category.name,
      plans: category.plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
      })),
    })),
  }));
}

export function resolveClientInterest(tree: CatalogTree, input: ClientInterestInput): ClientInterestSnapshot {
  const planId = String(input.interestPlanId ?? "").trim();
  const subcategoryId = String(input.interestSubcategoryId ?? "").trim();
  const serviceId = String(input.interestServiceId ?? "").trim();

  if (!planId && !subcategoryId && !serviceId) {
    return emptyClientInterest();
  }

  if (planId) {
    for (const service of tree) {
      for (const category of service.subcategories) {
        const plan = category.plans.find((entry) => entry.id === planId);
        if (plan) {
          return {
            interestServiceId: service.id,
            interestServiceName: service.name,
            interestSubcategoryId: category.id,
            interestSubcategoryName: category.name,
            interestPlanId: plan.id,
            interestPlanName: plan.name,
          };
        }
      }
    }

    throw new Error("El plan seleccionado no existe.");
  }

  if (subcategoryId) {
    for (const service of tree) {
      const category = service.subcategories.find((entry) => entry.id === subcategoryId);
      if (category) {
        return {
          interestServiceId: service.id,
          interestServiceName: service.name,
          interestSubcategoryId: category.id,
          interestSubcategoryName: category.name,
          interestPlanId: null,
          interestPlanName: "",
        };
      }
    }

    throw new Error("La categoría seleccionada no existe.");
  }

  const service = tree.find((entry) => entry.id === serviceId);
  if (!service) {
    throw new Error("El servicio seleccionado no existe.");
  }

  return {
    interestServiceId: service.id,
    interestServiceName: service.name,
    interestSubcategoryId: null,
    interestSubcategoryName: "",
    interestPlanId: null,
    interestPlanName: "",
  };
}
