export function productWeightOptions(product) {
  if (!product?.weight_options) return [];
  if (Array.isArray(product.weight_options)) return product.weight_options;
  return String(product.weight_options)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
