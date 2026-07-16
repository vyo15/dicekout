import { slugifyProductName } from "../../../frontend/src/domain/catalog/normalizeProduct.js";

export const slugifyProductValue = slugifyProductName;

export const createUniqueProductIdentity = (name, products = []) => {
  const base = slugifyProductValue(name) || "produk-baru";
  const usedIds = new Set(products.map((item) => item.id));
  const usedSlugs = new Set(products.map((item) => item.slug));
  let suffix = 1;
  let slug = base;
  let id = `prod-${slug}`;
  while (usedSlugs.has(slug) || usedIds.has(id)) {
    suffix += 1;
    slug = `${base}-${suffix}`;
    id = `prod-${slug}`;
  }
  return { id, slug };
};
