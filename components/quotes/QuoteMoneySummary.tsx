import { formatCurrency } from "@/lib/orders/service";
import { formatQuoteDiscountLabel, formatQuoteDiscountValue, quoteItemsGross } from "@/lib/quotes/pricing";
import type { QuoteRecord } from "@/lib/quotes/types";

type QuoteMoneySummaryProps = {
  quote: Pick<QuoteRecord, "items" | "subtotal" | "tax" | "total" | "discountType" | "discountValue" | "discountAmount">;
  taxPercent: number;
};

export function QuoteMoneySummary({ quote, taxPercent }: QuoteMoneySummaryProps) {
  const gross = quoteItemsGross(quote.items);
  const discountLabel = formatQuoteDiscountLabel(quote);

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between text-muted">
        <span>Subtotal</span>
        <span>{formatCurrency(gross.subtotal)}</span>
      </div>
      {discountLabel ? (
        <div className="flex items-center justify-between text-muted">
          <span>{discountLabel}</span>
          <span>{formatQuoteDiscountValue(quote)}</span>
        </div>
      ) : null}
      <div className="flex items-center justify-between text-muted">
        <span>IVA ({taxPercent}%)</span>
        <span>{formatCurrency(quote.tax)}</span>
      </div>
      <div className="flex items-end justify-between border-t border-border pt-3">
        <span className="text-sm font-bold uppercase tracking-[0.08em] text-navy">Inversión total</span>
        <span className="text-2xl font-bold tracking-[-0.05em] text-magenta">{formatCurrency(quote.total)}</span>
      </div>
      <p className="text-right text-xs text-muted">IVA incluido</p>
    </div>
  );
}
