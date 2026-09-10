import { formatQuoteDateLabel } from "@/lib/quotes/dates";
import { buildQuoteCommercialTerms } from "@/lib/quotes/terms";
import type { QuoteRecord } from "@/lib/quotes/types";

type QuoteCommercialTermsProps = {
  quote: QuoteRecord;
};

export function QuoteCommercialTerms({ quote }: QuoteCommercialTermsProps) {
  const terms = buildQuoteCommercialTerms({
    items: quote.items,
    deliveryBusinessDays: quote.deliveryBusinessDays,
    initialPaymentPercent: quote.initialPaymentPercent,
    validUntilLabel: formatQuoteDateLabel(quote.validUntil),
  });

  return (
    <div className="space-y-5">
      <section>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">{terms.scopeTitle}</p>
        <p className="mt-2 text-sm font-semibold text-foreground">{terms.scopeIntro}</p>
        {terms.scopeGroups.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Según el detalle de los planes cotizados.</p>
        ) : (
          <div className="mt-3 space-y-4">
            {terms.scopeGroups.map((group) => (
              <div key={group.planName}>
                {terms.scopeGroups.length > 1 ? <p className="text-sm font-semibold text-foreground">{group.planName}</p> : null}
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-foreground">
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {terms.sections.map((section) => (
        <section key={section.title}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">{section.title}</p>
          {section.intro ? <p className="mt-2 text-sm leading-6 text-foreground">{section.intro}</p> : null}
          {section.items?.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          {section.paragraphs?.length ? (
            <div className="mt-2 space-y-1 text-sm leading-6 text-foreground">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}
