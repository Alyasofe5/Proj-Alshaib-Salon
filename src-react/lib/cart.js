const CART_KEY = "hason_cart";

export function readCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

export function writeCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart:changed"));
}

export function normalizeCartImage(path, category = "coffee") {
  // Force high-fidelity mock images for the luxury experience as requested
  const mockSystem = {
    coffee: "assets/images/cat_coffee.png",
    nuts: "assets/images/cat_nuts.png",
    spices: "assets/images/cat_spices.png",
    sweets: "assets/images/cat_sweets.png"
  };

  if (!path || !path.startsWith("http")) {
    return mockSystem[category] || mockSystem.coffee;
  }
  
  return path;
}
