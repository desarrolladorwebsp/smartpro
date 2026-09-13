"use client";

import { formatCurrency } from "@/lib/orders/service";

type CartSummaryProps = {
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
};

export default function CartSummary({ subtotal, tax, total, itemCount }: CartSummaryProps) {
  return (
    <div className="rounded-[1.5rem] border border-primary/10 bg-gradient-to-br from-white to-soft-background p-5 shadow-[0_18px_48px_rgba(109,40,217,0.08)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Resumen</p>
      <div className="mt-4 space-y-3 text-sm text-foreground">
        <div className="flex items-center justify-between">
          <span>Productos</span>
          <span>{itemCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>IVA</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        <div className="mt-3 border-t border-border pt-3 text-base font-bold">
          <div className="flex items-center justify-between">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
