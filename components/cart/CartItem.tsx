"use client";

import { Minus, Plus, Trash2 } from "lucide-react";

import { formatCurrency } from "@/lib/orders/service";

import type { CartItem as CartItemType } from "@/components/cart/CartProvider";

type CartItemProps = {
  item: CartItemType;
  onRemove: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
};

export default function CartItem({ item, onRemove, onUpdateQuantity }: CartItemProps) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-[0_8px_24px_rgba(16,16,36,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-primary">{item.category}</p>
        </div>

        <button
          type="button"
          aria-label={`Eliminar ${item.name}`}
          onClick={() => onRemove(item.id)}
          className="rounded-full p-2 text-muted transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="inline-flex items-center rounded-full border border-border bg-soft-background">
          <button
            type="button"
            aria-label={`Disminuir cantidad de ${item.name}`}
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            className="flex h-9 w-9 items-center justify-center text-foreground hover:text-primary"
          >
            <Minus size={14} />
          </button>

          <span className="min-w-9 text-center text-sm font-semibold text-foreground">{item.quantity}</span>

          <button
            type="button"
            aria-label={`Aumentar cantidad de ${item.name}`}
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="flex h-9 w-9 items-center justify-center text-foreground hover:text-primary"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="text-right">
          <p className="text-sm font-semibold text-foreground">{formatCurrency(item.unitPrice * item.quantity)}</p>
          <p className="text-[11px] text-muted">{formatCurrency(item.unitPrice)} c/u</p>
        </div>
      </div>
    </div>
  );
}
