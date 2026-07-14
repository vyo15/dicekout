import categoriesData from "../data/categories.json" with { type: "json" };
import collectionsData from "../data/collections.json" with { type: "json" };
import productsData from "../data/products.json" with { type: "json" };

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
  collection = "all",
  sort = "recommended",
  featured = false,
  newest = false,
} = {}) => {
  const normalizedQuery = normalizeSearchText(query);
  let result = products.filter((product) => {
    const matchesCategory = category === "all" || product.categorySlug === category;
    const matchesCollection = collection === "all" || (product.collectionSlugs || []).includes(collection);
    const matchesFeatured = !featured || product.featured;
    const matchesNewest = !newest || product.newest;
    if (!matchesCategory || !matchesCollection || !matchesFeatured || !matchesNewest) return false;
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

export const getSearchSuggestions = (query = "", limit = 6) => {
  const normalizedQuery = normalizeSearchText(query);
  if (normalizedQuery.length < 2) return [];

  const score = (value) => {
    const normalizedValue = normalizeSearchText(value);
    if (normalizedValue === normalizedQuery) return 0;
    if (normalizedValue.startsWith(normalizedQuery)) return 1;
    if (normalizedValue.includes(normalizedQuery)) return 2;
    return 99;
  };

  const productSuggestions = products.map((product) => {
    const terms = [product.name, ...(product.aliases || []), ...(product.keywords || [])];
    const bestScore = Math.min(...terms.map(score));
    return {
      id: `product-${product.id}`,
      type: "product",
      label: product.name,
      description: getCategory(product.categorySlug)?.name || "Produk",
      to: `/produk/${product.slug}`,
      score: bestScore,
      order: product.sortOrder ?? 999,
    };
  }).filter((item) => item.score < 99);

  const categorySuggestions = categories.map((category) => ({
    id: `category-${category.id}`,
    type: "category",
    label: category.name,
    description: "Kategori",
    to: `/kategori/${category.slug}`,
    score: Math.min(score(category.name), score(category.description)),
    order: category.order ?? 999,
  })).filter((item) => item.score < 99);

  const collectionSuggestions = collections.map((collection) => ({
    id: `collection-${collection.id}`,
    type: "collection",
    label: collection.name,
    description: "Koleksi kebutuhan",
    to: `/koleksi/${collection.slug}`,
    score: Math.min(score(collection.name), score(collection.description)),
    order: collection.order ?? 999,
  })).filter((item) => item.score < 99);

  return [...productSuggestions, ...categorySuggestions, ...collectionSuggestions]
    .sort((a, b) => a.score - b.score || a.order - b.order || a.label.localeCompare(b.label, "id"))
    .slice(0, limit);
};

export const suggestedSearchTerms = Object.freeze([
  "lampu meja",
  "stand hp",
  "setup meja",
  "alat rumah praktis",
]);
