import React, { createContext, useContext, useState } from "react";
import { useCartStore } from "../hooks/useCartStore";

export const CartContext = createContext(null);

export function CartProvider({ children }) {
  const cart = useCartStore();
  const [isOpen, setIsOpen] = useState(false);
  return (
    <CartContext.Provider value={{ ...cart, isOpen, setIsOpen }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
