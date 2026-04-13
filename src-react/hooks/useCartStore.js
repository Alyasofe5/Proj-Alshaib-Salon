import { useEffect, useMemo, useState } from "react";
import { readCart, writeCart, normalizeCartImage } from "../lib/cart";
import { detectLegacyCategory } from "../utils/imageUtils";

export function useCartStore() {
  const [items, setItems] = useState(readCart());

  useEffect(() => {
    const sync = () => setItems(readCart());
    window.addEventListener("storage", sync);
    window.addEventListener("cart:changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("cart:changed", sync);
    };
  }, []);

  return useMemo(() => {
    const addItem = (product, quantity = 1, weight = "") => {
      const current = readCart();
      const label = weight ? `${product.name} (${weight})` : product.name;
      const id = weight ? `${product.id}:${weight}` : String(product.id);
      const existing = current.find((item) => item.id === id);

      const cat = product.category || detectLegacyCategory(product.name, product.image_url);

      if (existing) {
        existing.q += quantity;
      } else {
        current.push({
          id,
          baseId: product.id,
          name: label,
          price: Number(product.on_sale && product.sale_price ? product.sale_price : (product.price || 0)),
          image: normalizeCartImage(product.image_url, cat),
          q: quantity,
          isOnSale: !!(product.on_sale && product.sale_price),
          category: cat
        });
      }
      writeCart(current);
      setItems(readCart());
    };

    const removeItem = (id) => {
      writeCart(readCart().filter((item) => item.id !== id));
      setItems(readCart());
    };

    const updateQuantity = (id, quantity) => {
      writeCart(
        readCart().map((item) => (item.id === id ? { ...item, q: Math.max(1, quantity) } : item))
      );
      setItems(readCart());
    };

    const clearCart = () => {
      writeCart([]);
      setItems([]);
    };

    return {
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      count: items.reduce((sum, item) => sum + Number(item.q || 0), 0),
      subtotal: items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.q || 0), 0)
    };
  }, [items]);
}
