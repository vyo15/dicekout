export const slugifyProductValue = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 96);

export const createUniqueProductIdentity = (name, products = [], drafts = []) => {
  const base = slugifyProductValue(name) || "produk-baru";
  const usedSlugs = new Set([...products, ...drafts].map((item) => item?.slug).filter(Boolean));
  const usedIds = new Set([...products, ...drafts].map((item) => item?.id).filter(Boolean));
  let suffix = 1;
  let slug = base;
  let id = `prod-${base}`;
  while (usedSlugs.has(slug) || usedIds.has(id)) {
    suffix += 1;
    slug = `${base}-${suffix}`;
    id = `prod-${base}-${suffix}`;
  }
  return { id, slug };
};
