"use client";

import { motion } from "motion/react";
import { ArrowRight, Check, Star } from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

export type Plan = {
  badge?: string | null;
  icon?: string | null;
  accentIcon?: string | null;

  name: string;

  oldPrice?: string | null;
  price: string;
  tax?: string | null;

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
};

/* ============================================================
   COMPONENT
============================================================ */

export default function PlanCard({ plan, index }: PlanCardProps) {
  const href = plan.link ?? plan.link2 ?? "#contacto";

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 24,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.45,
        delay: index * 0.06,
        ease: "easeOut",
      }}
      className={`
        group
        relative
        flex
        h-full
        min-w-0
        flex-col
        rounded-[24px]
        border
        bg-white
        p-5
        transition-all
        duration-300
        sm:p-6

        ${
          plan.highlighted
            ? `
              border-magenta/60
              shadow-[0_20px_60px_rgba(236,22,140,0.10)]
            `
            : `
              border-border
              shadow-[0_12px_35px_rgba(16,16,36,0.06)]
            `
        }
      `}
    >
      {/* ======================================================
          BADGE
      ====================================================== */}

      {plan.badge && (
        <div className="mb-5 flex justify-center">
          <span
            className="
              inline-flex
              min-h-8
              items-center
              justify-center
              gap-1.5
              rounded-full
              bg-gradient-to-r
              from-primary
              to-magenta
              px-4
              text-[11px]
              font-bold
              uppercase
              tracking-[0.08em]
              text-white
              shadow-[0_8px_24px_rgba(236,22,140,0.20)]
            "
          >
            <Star size={12} fill="currentColor" />

            {cleanBadge(plan.badge)}
          </span>
        </div>
      )}

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="text-center">
        <h3
          className="
            text-balance
            text-[22px]
            font-bold
            leading-tight
            tracking-[-0.035em]
            text-foreground
            sm:text-[25px]
          "
        >
          {plan.name}
        </h3>

        {plan.summary && (
          <p
            className="
              mx-auto
              mt-3
              max-w-sm
              text-sm
              leading-6
              text-muted
            "
          >
            {stripHtml(plan.summary)}
          </p>
        )}
      </div>

      {/* ======================================================
          PRICE
      ====================================================== */}

      <div
        className="
          mt-6
          border-b
          border-border
          pb-5
          text-center
        "
      >
        {plan.oldPrice && (
          <p
            className="
              mb-1
              text-sm
              font-semibold
              text-muted
            "
          >
            {plan.oldPrice}
          </p>
        )}

        <div
          className="
            flex
            flex-wrap
            items-end
            justify-center
            gap-x-2
          "
        >
          <span
            className="
              bg-gradient-to-r
              from-primary
              via-violet-500
              to-magenta
              bg-clip-text
              text-[34px]
              font-extrabold
              leading-none
              tracking-[-0.05em]
              text-transparent
              sm:text-[38px]
            "
          >
            {plan.price}
          </span>

          {plan.tax && (
            <span
              className="
                pb-0.5
                text-sm
                font-bold
                text-foreground
              "
            >
              {plan.tax}
            </span>
          )}
        </div>
      </div>

      {/* ======================================================
          FEATURES
      ====================================================== */}

      <div className="flex-1 py-5">
        {plan.featureGroupTitle && (
          <p
            className="
              mb-3
              text-sm
              font-semibold
              text-foreground
            "
          >
            {plan.featureGroupTitle}
          </p>
        )}

        <ul className="space-y-3">
          {plan.features.map((feature, featureIndex) => (
            <li
              key={`${plan.name}-${featureIndex}`}
              className="
                  flex
                  items-start
                  gap-3
                "
            >
              <span
                className="
                    mt-0.5
                    flex
                    h-5
                    w-5
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-primary/8
                    text-primary
                  "
              >
                <Check size={13} strokeWidth={2.5} />
              </span>

              <FeatureText html={feature} />
            </li>
          ))}
        </ul>

        {plan.note && (
          <p
            className="
              mt-5
              rounded-xl
              bg-soft-background
              px-4
              py-3
              text-xs
              leading-5
              text-muted
            "
          >
            {stripHtml(plan.note)}
          </p>
        )}
      </div>

      {/* ======================================================
          CTA
      ====================================================== */}

      <motion.a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        whileTap={{
          scale: 0.985,
        }}
        className={`
          group/button
          flex
          min-h-[50px]
          w-full
          items-center
          justify-center
          gap-2
          rounded-[14px]
          px-5
          text-sm
          font-semibold
          transition-all
          duration-300

          ${
            plan.highlighted
              ? `
                bg-gradient-to-r
                from-primary
                to-magenta
                text-white
                shadow-[0_10px_30px_rgba(109,40,217,0.20)]

                hover:
                shadow-[0_14px_38px_rgba(236,22,140,0.24)]
              `
              : `
                bg-primary
                text-white

                hover:
                bg-primary-hover
              `
          }
        `}
      >
        Elegir plan
        <ArrowRight
          size={16}
          strokeWidth={2}
          className="
            transition-transform
            duration-300
            group-hover/button:translate-x-1
          "
        />
      </motion.a>
    </motion.article>
  );
}

/* ============================================================
   FEATURE TEXT

   Tus datos tienen algunos <strong>...</strong>.
   Los interpretamos SIN dangerouslySetInnerHTML.
============================================================ */

function FeatureText({ html }: { html: string }) {
  const parts = html.split(/(<strong>.*?<\/strong>)/g);

  return (
    <span
      className="
        text-sm
        leading-6
        text-foreground/75
      "
    >
      {parts.map((part, index) => {
        const strongMatch = part.match(/^<strong>(.*?)<\/strong>$/);

        if (strongMatch) {
          return (
            <strong
              key={index}
              className="
                font-semibold
                text-foreground
              "
            >
              {strongMatch[1]}
            </strong>
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

/* ============================================================
   HELPERS
============================================================ */

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "");
}

function cleanBadge(value: string) {
  return value.replace("★", "").replace("⭐", "").trim();
}
