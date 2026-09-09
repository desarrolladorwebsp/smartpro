"use client";

import { useState } from "react";

import { motion } from "motion/react";

import { ArrowRight } from "lucide-react";

import ServicePlansModal from "./ServicePlansModal";

import type { Plan } from "./PlanCard";
import type { ServiceCategoryOption } from "@/lib/services/category-cards";

type ViewServiceButtonProps = {
  categorySlug: string;
  title?: string;
  label?: string;
  className?: string;
  initialPlans?: Plan[];
  initialCategories?: ServiceCategoryOption[];
};

type CatalogCategoryResponse = {
  source?: string;
  category?: {
    name: string;
    slug: string;
  };
  categories?: Array<{
    id?: string;
    name: string;
    slug?: string;
  }>;
  plans?: Plan[];
  error?: string;
};

export default function ViewServiceButton({
  categorySlug,
  title,
  label = "Ver servicio",
  className = "",
  initialPlans = [],
  initialCategories = [],
}: ViewServiceButtonProps) {
  const [open, setOpen] = useState(false);
  const [fetchedPlans, setFetchedPlans] = useState<Plan[] | null>(null);
  const [fetchedCategories, setFetchedCategories] = useState<ServiceCategoryOption[] | null>(null);
  const [modalTitle, setModalTitle] = useState(title ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const plans = fetchedPlans ?? initialPlans;
  const categories = fetchedCategories ?? initialCategories;

  const handleOpen = async () => {
    setOpen(true);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/catalog?category=${encodeURIComponent(categorySlug)}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json().catch(() => ({}))) as CatalogCategoryResponse;

      if (!response.ok || !Array.isArray(data.plans)) {
        throw new Error(data.error ?? "No se pudieron cargar los planes.");
      }

      setFetchedPlans(data.plans);
      setFetchedCategories(
        Array.isArray(data.categories)
          ? data.categories
              .filter((category) => Boolean(category.name?.trim()))
              .map((category) => ({
                id: category.id ?? category.slug ?? category.name,
                name: category.name,
                slug: category.slug ?? "",
              }))
          : [],
      );
      setModalTitle(data.category?.name ?? title ?? "Planes SmartPro");
    } catch (loadError) {
      if (plans.length === 0) {
        setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar los planes.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <motion.button
        type="button"
        onClick={() => void handleOpen()}
        disabled={isLoading && plans.length === 0}
        whileTap={{ scale: 0.97 }}
        className={`
          group/button
          inline-flex
          min-h-11
          items-center
          justify-center
          gap-7
          rounded-full
          border
          border-primary/70
          bg-black/10
          px-5
          text-sm
          font-semibold
          text-white
          backdrop-blur-sm
          transition-all
          duration-300
          hover:border-magenta
          hover:bg-primary/20
          disabled:cursor-not-allowed
          disabled:opacity-70
          ${className}
        `}
      >
        {isLoading && plans.length === 0 ? "Cargando..." : label}

        <ArrowRight
          size={16}
          strokeWidth={1.8}
          className="transition-transform duration-300 group-hover/button:translate-x-1"
        />
      </motion.button>

      {error && !open ? (
        <p className="mt-2 text-xs text-red-300" role="alert">
          {error}
        </p>
      ) : null}

      <ServicePlansModal
        open={open}
        title={modalTitle}
        plans={plans}
        categories={categories}
        isLoading={isLoading}
        error={error}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
