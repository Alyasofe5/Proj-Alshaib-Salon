export function normalizeImagePath(path, category = "coffee") {
  const mockSystem = {
    coffee: "/assets/images/cat_coffee.png",
    nuts: "/assets/images/prod_nuts.png",
    spices: "/assets/images/cat_spices.png",
    sweets: "/assets/images/cat_sweets.png"
  };

  if (!path || !path.startsWith("http")) {
    return mockSystem[category] || mockSystem.coffee;
  }
  return path;
}

export function detectLegacyCategory(name, img) {
  const ref = `${name || ""} ${img || ""}`.toLowerCase();
  if (ref.includes("nuts") || ref.includes("بذور") || ref.includes("مكسرات") || ref.includes("شيا") || ref.includes("نبات")) return "nuts";
  if (ref.includes("sweets") || ref.includes("حلويات") || ref.includes("سكاكر")) return "sweets";
  if (ref.includes("spices") || ref.includes("بهارات") || ref.includes("توابل")) return "spices";
  return "coffee";
}

