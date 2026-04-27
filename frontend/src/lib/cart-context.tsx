"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { cartApi } from "./api-client";
import { useAuth } from "./auth-context";

interface CartContextType {
  cartCount: number;
  refreshCartCount: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartCount, setCartCount] = useState(0);
  const { user } = useAuth();

  const refreshCartCount = useCallback(async () => {
    if (!user) {
      setCartCount(0);
      return;
    }
    try {
      const data = await cartApi.getCart();
      const items = Array.isArray(data) ? data : (data as any).results || [];
      // Count unique items or total quantity? Usually unique items count is shown.
      setCartCount(items.length);
    } catch (error) {
      console.error("Error refreshing cart count:", error);
    }
  }, [user]);

  useEffect(() => {
    refreshCartCount();
  }, [refreshCartCount]);

  return (
    <CartContext.Provider value={{ cartCount, refreshCartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
