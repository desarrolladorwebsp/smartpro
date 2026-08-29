"use client";

import { useState } from "react";

import { AnimatePresence, motion } from "motion/react";
import { ShoppingCart } from "lucide-react";

import { useCart } from "@/components/cart/CartProvider";

import CartDrawer from "@/components/cart/CartDrawer";

export default function CartButton() {
  const { itemCount } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        type="button"
        aria-label="Abrir carrito de compras"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(true)}
        className="
          relative
          inline-flex
          h-11
          w-11
          items-center
          justify-center
          rounded-full
          border
          border-primary/15
          bg-surface
          text-foreground
          shadow-[0_8px_24px_rgba(109,40,217,0.08)]
          transition-all
          duration-300
          hover:border-primary/40
          hover:text-primary
          lg:h-12
          lg:w-12
        "
      >
        <ShoppingCart size={18} strokeWidth={2.1} />

        <AnimatePresence mode="wait">
          {itemCount > 0 && (
            <motion.span
              key={itemCount}
              initial={{ scale: 0.75, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.75, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="
                absolute
                -right-1.5
                -top-1.5
                flex
                min-h-5
                min-w-5
                items-center
                justify-center
                rounded-full
                bg-gradient-to-r
                from-primary
                to-magenta
                px-1.5
                text-[10px]
                font-bold
                text-white
              "
            >
              {itemCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
