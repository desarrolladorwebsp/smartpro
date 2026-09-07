"use client";

import { useEffect } from "react";
import Link from "next/link";

import { AnimatePresence, motion } from "motion/react";
import { ShoppingBag, X } from "lucide-react";

import CartItem from "@/components/cart/CartItem";
import CartSummary from "@/components/cart/CartSummary";
import { useCart } from "@/components/cart/CartProvider";

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, subtotal, tax, total, itemCount, removeItem, updateQuantity, clearCart } = useCart();

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Cerrar carrito"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] cursor-default bg-navy/40 backdrop-blur-sm"
          />

          <motion.aside
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
            className="fixed right-0 top-0 z-[70] flex h-screen w-full max-w-md flex-col border-l border-border bg-background shadow-[0_30px_80px_rgba(11,11,20,0.18)]"
          >
            <div className="flex items-center justify-between border-b border-border bg-white/80 px-5 py-4 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/8 text-primary">
                  <ShoppingBag size={18} />
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Carrito</p>
                  <p className="text-sm font-semibold text-foreground">{itemCount} productos</p>
                </div>
              </div>

              <button type="button" aria-label="Cerrar carrito" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-muted hover:text-primary">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-border bg-white p-7 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/8 text-primary">
                    <ShoppingBag size={28} />
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-foreground">Tu carrito está vacío</h3>
                  <p className="mt-2 text-sm text-muted">Agrega un plan para continuar con tu proyecto.</p>
                  <Link href="/#servicios" onClick={onClose} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white">
                    Explorar servicios
                  </Link>
                </div>
              ) : (
                <>
                  {items.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onRemove={removeItem}
                      onUpdateQuantity={updateQuantity}
                    />
                  ))}
                </>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-border bg-white/80 p-5 backdrop-blur-xl">
                <CartSummary subtotal={subtotal} tax={tax} total={total} itemCount={itemCount} onCheckout={onClose} />
                <div className="mt-3 flex gap-3">
                  <button type="button" onClick={clearCart} className="flex-1 rounded-full border border-border bg-soft-background px-4 py-2.5 text-sm font-medium text-foreground">
                    Vaciar
                  </button>
                  <Link href="/checkout" onClick={onClose} className="flex-1 rounded-full bg-gradient-to-r from-primary to-magenta px-4 py-2.5 text-center text-sm font-semibold text-white">
                    Checkout
                  </Link>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
