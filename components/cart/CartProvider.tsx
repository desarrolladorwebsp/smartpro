"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { formatCurrency, sanitizeCartItem, type CartItemDraft } from "@/lib/orders/service";

export type CartItem = CartItemDraft & {
  taxRate: number;
};

export type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  tax: number;
  total: number;
  isHydrated: boolean;
  addItem: (item: Partial<CartItemDraft> & { id: string; name: string; category: string }) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
};

const CART_STORAGE_KEY = "smartpro-cart";

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  // El estado inicial debe ser idéntico en servidor y cliente (siempre []).
  // localStorage solo se lee después del montaje, dentro de un efecto,
  // para no provocar un mismatch de hidratación.
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Se difiere a un microtask para no llamar a setState de forma
    // síncrona dentro del cuerpo del efecto (regla react-hooks/set-state-in-effect).
    queueMicrotask(() => {
      try {
        const raw = window.localStorage.getItem(CART_STORAGE_KEY);

        if (raw) {
          const parsed = JSON.parse(raw) as Partial<CartItem>[];
          const sanitized = parsed
            .map((item) => sanitizeCartItem(item))
            .filter(Boolean) as CartItem[];

          setItems(sanitized);
        }
      } catch {
        // Almacenamiento corrupto o inaccesible: se ignora y se mantiene el carrito vacío.
      } finally {
        setIsHydrated(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [isHydrated, items]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const tax = subtotal * (items[0]?.taxRate ?? 0.19);
    const total = subtotal + tax;

    return {
      subtotal,
      tax,
      total,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }, [items]);

  const addItem = (item: Partial<CartItemDraft> & { id: string; name: string; category: string }) => {
    const sanitized = sanitizeCartItem(item);

    if (!sanitized) {
      return;
    }

    setItems((current) => {
      const existing = current.find((entry) => entry.id === sanitized.id);

      if (existing) {
        return current.map((entry) =>
          entry.id === sanitized.id
            ? {
                ...entry,
                quantity: entry.quantity + sanitized.quantity,
                priceDisplay: sanitized.priceDisplay ?? formatCurrency(entry.unitPrice),
              }
            : entry,
        );
      }

      return [
        ...current,
        {
          ...sanitized,
          taxRate: sanitized.taxRate ?? 0.19,
          priceDisplay: sanitized.priceDisplay ?? formatCurrency(sanitized.unitPrice),
        },
      ];
    });
  };

  const removeItem = (itemId: string) => {
    setItems((current) => current.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    const normalizedQuantity = Math.max(1, Number(quantity) || 1);

    setItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: normalizedQuantity,
            }
          : item,
      ),
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: totals.itemCount,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      isHydrated,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }),
    [items, totals, isHydrated],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart debe usarse dentro de CartProvider");
  }

  return context;
}
