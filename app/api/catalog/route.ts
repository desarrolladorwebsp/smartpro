import { NextResponse } from "next/server";

import { hasDatabaseConnection } from "@/lib/db";
import { mapServicePlanToPlan, mapServicePlansToPlans } from "@/lib/services/map-to-plan";
import { getPublicCatalogTree, getPublicCategoryPlans } from "@/lib/services/repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const responseHeaders = {
  "Cache-Control": "no-store",
};

export async function GET(request: Request) {
  if (!hasDatabaseConnection()) {
    return NextResponse.json(
      { error: "Catálogo no disponible en este momento." },
      { status: 503, headers: responseHeaders },
    );
  }

  const categorySlug = new URL(request.url).searchParams.get("category")?.trim();

  try {
    if (categorySlug) {
      const category = await getPublicCategoryPlans(categorySlug);

      if (!category) {
        return NextResponse.json(
          { error: "Categoría no encontrada." },
          { status: 404, headers: responseHeaders },
        );
      }

      return NextResponse.json(
        {
          source: "database",
          service: {
            name: category.name,
            slug: category.slug,
          },
          category: {
            name: category.name,
            slug: category.slug,
          },
          categories: category.categories.map((entry) => ({
            id: entry.id,
            name: entry.name,
            slug: entry.slug,
          })),
          plans: mapServicePlansToPlans(category.plans),
        },
        { status: 200, headers: responseHeaders },
      );
    }

    const tree = await getPublicCatalogTree();

    return NextResponse.json(
      {
        source: "database",
        tree: tree.map((category) => ({
          ...category,
          subcategories: category.subcategories.map((subcategory) => ({
            ...subcategory,
            plans: subcategory.plans.map(mapServicePlanToPlan),
          })),
        })),
      },
      { status: 200, headers: responseHeaders },
    );
  } catch (error) {
    console.error("[smartpro:catalog:read]", error);
    return NextResponse.json(
      { error: "No se pudo cargar el catálogo de servicios." },
      { status: 500, headers: responseHeaders },
    );
  }
}
