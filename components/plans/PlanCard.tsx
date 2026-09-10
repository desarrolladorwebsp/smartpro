"use client";

import { useId, useState } from "react";

import { motion } from "motion/react";
import { ArrowRight, Check, ChevronDown, Star } from "lucide-react";

import { useCart } from "@/components/cart/CartProvider";
import { parseMoney } from "@/lib/orders/service";
import { getVisiblePlanFeatures, shouldShowPlanFeaturesToggle } from "@/lib/services/plan-features";

export type Plan = {
  id?: string;
  category?: string;
  subcategory?: string | null;
  badge?: string | null;
  icon?: string | null;
  accentIcon?: string | null;

  name: string;

  oldPrice?: string | null;
  price: string;
  tax?: string | null;
  taxRate?: number;

  summary?: string | null;

  featureGroupTitle?: string | null;

  features: string[];

  note?: string | null;

  highlighted?: boolean;

  link?: string;
  link2?: string;

  hasLogo?: string | null;

  isIsapre?: boolean;
  isConsalud?: boolean;
  isCotizalo?: boolean;
};

type PlanCardProps = {
  plan: Plan;
  index: number;
  onAdded?: (planName: string) => void;
};

export default function PlanCard({ plan, index, onAdded }: PlanCardProps) {
  const { addItem } = useCart();
  const featuresId = useId();
  const [isAdded, setIsAdded] = useState(false);
  const [featuresExpanded, setFeaturesExpanded] = useState(false);
  const visibleFeatures = getVisiblePlanFeatures(plan.features, featuresExpanded);
  const showFeaturesToggle = shouldShowPlanFeaturesToggle(plan.features.length);

  const handleAddToCart = () => {
    const planId =
      plan.id ??
      plan.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    addItem({
      id: planId || `plan-${Date.now()}`,
      name: plan.name,
      category: plan.category ?? "Servicio SmartPro",
      quantity: 1,
      unitPrice: parseMoney(plan.price),
      priceDisplay: plan.price,
      taxRate: plan.taxRate ?? 0.19,
      source: "plan-card",
    });

    setIsAdded(true);
    onAdded?.(plan.name);

    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        setIsAdded(false);
      }, 1200);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.32,
        delay: Math.min(index * 0.04, 0.2),
        ease: "easeOut",
      }}
      className={`
        group
        relative
        flex
        h-full
        w-full
        min-w-0
        flex-col
        rounded-[18px]
        border
        bg-white
        px-4
        py-3.5
        transition-[transform,box-shadow,border-color]
        duration-300
        ease-out
        hover:z-[1]
        hover:-translate-y-1
        hover:scale-[1.015]
        origin-center
        hover:border-magenta/75
        hover:shadow-[0_20px_44px_rgba(109,40,217,0.18),0_10px_20px_rgba(236,22,140,0.12)]
        ${
          plan.highlighted
            ? "border-magenta/70 shadow-[0_14px_36px_rgba(236,22,140,0.10)]"
            : "border-border shadow-[0_8px_22px_rgba(16,16,36,0.05)]"
        }
      `}
    >
      {plan.badge ? (
        <div className="mb-2.5 flex justify-center">
          <span
            className="
              inline-flex
              min-h-6
              items-center
              justify-center
              gap-1
              rounded-full
              bg-gradient-to-r
              from-primary
              to-magenta
              px-2.5
              text-[10px]
              font-semibold
              uppercase
              tracking-[0.08em]
              text-white
            "
          >
            <Star size={10} fill="currentColor" />
            {cleanBadge(plan.badge)}
          </span>
        </div>
      ) : null}

      <div className="text-center">
        <h3 className="text-pretty text-[15px] font-semibold leading-snug tracking-[-0.03em] text-foreground sm:text-base">
          {plan.name}
        </h3>

        {plan.summary ? (
          <p className="mt-1.5 line-clamp-2 text-[12px] leading-4 text-muted">{stripHtml(plan.summary)}</p>
        ) : null}
      </div>

      <div className="mt-3 border-b border-border pb-3 text-center">
        {plan.oldPrice ? <p className="mb-0.5 text-[11px] font-semibold text-muted">{plan.oldPrice}</p> : null}

        <div className="flex flex-wrap items-end justify-center gap-x-1.5">
          <span
            className="
              bg-gradient-to-r
              from-primary
              via-violet-500
              to-magenta
              bg-clip-text
              text-[1.5rem]
              font-bold
              leading-none
              tracking-[-0.04em]
              text-transparent
            "
          >
            {plan.price}
          </span>

          {plan.tax ? <span className="pb-px text-[11px] font-semibold text-foreground">{plan.tax}</span> : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col py-3">
        {plan.featureGroupTitle ? (
          <p className="mb-2 text-[12px] font-semibold text-foreground">{plan.featureGroupTitle}</p>
        ) : null}

        <ul id={featuresId} className="space-y-1.5">
          {visibleFeatures.map((feature, featureIndex) => (
            <li key={`${plan.name}-${featureIndex}`} className="flex items-start gap-2">
              <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary">
                <Check size={10} strokeWidth={2.6} />
              </span>
              <FeatureText html={feature} />
            </li>
          ))}
        </ul>

        {showFeaturesToggle ? (
          <button
            type="button"
            aria-expanded={featuresExpanded}
            aria-controls={featuresId}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setFeaturesExpanded((current) => !current);
            }}
            className="
              mt-2 inline-flex min-h-8 items-center gap-1 self-start rounded-full px-1.5
              text-[12px] font-semibold text-primary transition-colors duration-200
              hover:text-primary-hover
            "
          >
            {featuresExpanded ? "Ver menos" : "Ver más"}
            <ChevronDown
              size={14}
              strokeWidth={2.2}
              className={`pointer-events-none transition-transform duration-200 ${featuresExpanded ? "rotate-180" : ""}`}
            />
          </button>
        ) : null}

        {plan.note ? (
          <p className="mt-3 rounded-lg bg-soft-background px-2.5 py-2 text-[11px] leading-4 text-muted">
            {stripHtml(plan.note)}
          </p>
        ) : null}
      </div>

      <motion.button
        type="button"
        onClick={handleAddToCart}
        whileTap={{ scale: 0.985 }}
        className={`
          group/button
          mt-auto
          flex
          min-h-10
          w-full
          items-center
          justify-center
          gap-1.5
          rounded-xl
          px-4
          text-[13px]
          font-semibold
          transition-all
          duration-300
          ${
            isAdded
              ? "bg-emerald-500 text-white shadow-[0_8px_20px_rgba(16,185,129,0.24)]"
              : plan.highlighted
                ? "bg-gradient-to-r from-primary to-magenta text-white shadow-[0_8px_20px_rgba(109,40,217,0.18)] hover:shadow-[0_10px_24px_rgba(236,22,140,0.22)]"
                : "bg-primary text-white hover:bg-primary-hover"
          }
        `}
      >
        {isAdded ? (
          <>
            <Check size={14} />
            Agregado
          </>
        ) : (
          <>
            Elegir plan
            <ArrowRight
              size={14}
              strokeWidth={2}
              className="transition-transform duration-300 group-hover/button:translate-x-0.5"
            />
          </>
        )}
      </motion.button>
    </motion.article>
  );
}

function FeatureText({ html }: { html: string }) {
  const parts = html.split(/(<strong>.*?<\/strong>)/g);

  return (
    <span className="text-[13px] leading-5 text-foreground/75">
      {parts.map((part, index) => {
        const strongMatch = part.match(/^<strong>(.*?)<\/strong>$/);

        if (strongMatch) {
          return (
            <strong key={index} className="font-semibold text-foreground">
              {strongMatch[1]}
            </strong>
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "");
}

function cleanBadge(value: string) {
  return value.replace("★", "").replace("⭐", "").trim();
}
