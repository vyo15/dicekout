import categoriesData from "../data/categories.json";
import collectionsData from "../data/collections.json";
import productsData from "../data/products.json";

const byOrder = (a, b) => (a.sortOrder ?? a.order ?? 999) - (b.sortOrder ?? b.order ?? 999);

export const categories = Object.freeze([...categoriesData].sort(byOrder));
export const collections = Object.freeze(
  collectionsData.filter((item) => item.status === "published").sort(byOrder),
);
export const products = Object.freeze(
  productsData.filter((item) => item.status === "published").sort(byOrder),
);

export const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));
export const collectionBySlug = new Map(collections.map((collection) => [collection.slug, collection]));
export const productBySlug = new Map(products.map((product) => [product.slug, product]));
export const productById = new Map(products.map((product) => [product.id, product]));

export const normalizeSearchText = (value = "") => String(value)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .trim();

export const getCategory = (slug) => categoryBySlug.get(slug) || null;
export const getCollection = (slug) => collectionBySlug.get(slug) || null;
export const getProduct = (slug) => productBySlug.get(slug) || null;

export const getProductsByCategory = (slug) => products.filter((product) => product.categorySlug === slug);

export const getProductsByCollection = (slug) => {
  const collection = getCollection(slug);
  if (!collection) return [];
  return collection.productIds.map((id) => productById.get(id)).filter(Boolean);
};

export const getRelatedProducts = (product, limit = 4) => products
  .filter((candidate) => candidate.id !== product.id && candidate.categorySlug === product.categorySlug)
  .slice(0, limit);

export const getPrimaryAffiliateLink = (product) => {
  const activeLinks = Array.isArray(product?.affiliateLinks)
    ? product.affiliateLinks.filter((link) => link.status !== "inactive")
    : [];
  return activeLinks.find((link) => link.isPrimary) || activeLinks[0] || null;
};

export const searchProducts = ({
  query = "",
  category = "all",
  sort = "recommended",
  featured = false,
  newest = false,
} = {}) => {
  const normalizedQuery = normalizeSearchText(query);
  let result = products.filter((product) => {
    const matchesCategory = category === "all" || product.categorySlug === category;
    const matchesFeatured = !featured || product.featured;
    const matchesNewest = !newest || product.newest;
    if (!matchesCategory || !matchesFeatured || !matchesNewest) return false;
    if (!normalizedQuery) return true;

    const searchable = normalizeSearchText([
      product.name,
      product.summary,
      product.description,
      product.recommendationReason,
      ...(product.keywords || []),
      ...(product.aliases || []),
      ...(product.contentReferences || []).flatMap((reference) => [reference.label, reference.platform]),
      getCategory(product.categorySlug)?.name,
    ].filter(Boolean).join(" "));

    return searchable.includes(normalizedQuery);
  });

  if (sort === "name-asc") {
    result = [...result].sort((a, b) => a.name.localeCompare(b.name, "id"));
  } else if (sort === "newest") {
    result = [...result].sort((a, b) => Number(b.newest) - Number(a.newest) || byOrder(a, b));
  } else {
    result = [...result].sort((a, b) => Number(b.featured) - Number(a.featured) || byOrder(a, b));
  }

  return result;
};
