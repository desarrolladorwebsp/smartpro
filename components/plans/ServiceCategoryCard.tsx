"use client";

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

import type { ServiceCategoryCardModel } from "@/lib/services/category-cards";

type ServiceCategoryCardProps = {
  category: ServiceCategoryCardModel;
  index: number;
  onSelect: (categoryName: string) => void;
};

export default function ServiceCategoryCard({ category, index, onSelect }: ServiceCategoryCardProps) {
  const planLabel = `${category.planCount} ${category.planCount === 1 ? "plan" : "planes"}`;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.05, 0.2), ease: "easeOut" }}
      onClick={() => onSelect(category.name)}
      aria-label={`Ver planes de ${category.name}`}
      className="
        group flex h-full min-h-0 w-full flex-col gap-3 rounded-[18px] border border-border bg-white
        px-4 py-4 text-left shadow-[0_8px_22px_rgba(16,16,36,0.05)]
        transition-[transform,box-shadow,border-color] duration-300 ease-out
        hover:z-[1] hover:-translate-y-1 hover:scale-[1.015] hover:border-magenta/75
        hover:shadow-[0_20px_44px_rgba(109,40,217,0.18),0_10px_20px_rgba(236,22,140,0.12)]
        origin-center
        focus-visible:border-magenta/75
      "
    >
      <span className="inline-flex w-fit rounded-full bg-primary/8 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
        {planLabel}
      </span>

      <span className="text-[1.05rem] font-semibold tracking-[-0.03em] text-foreground">{category.name}</span>

      <span className="text-[13px] leading-5 text-muted">{category.description}</span>

      {category.audience ? (
        <span className="rounded-lg bg-soft-background px-2.5 py-2 text-[12px] leading-4 text-foreground/80">
          {category.audience}
        </span>
      ) : null}

      <span className="mt-auto flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-[13px] font-semibold text-white transition-colors duration-300 group-hover:bg-primary-hover">
        Ver planes
        <ArrowRight size={14} strokeWidth={2} className="transition-transform duration-300 group-hover:translate-x-0.5" />
      </span>
    </motion.button>
  );
}
