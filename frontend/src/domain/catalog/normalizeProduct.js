import { createProductDefaults } from "./productDefaults.js";

const cleanStrings = (value) => Array.isArray(value)
  ? value.map((item) => String(item || "").trim()).filter(Boolean)
  : [];

export const slugifyProductName = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 96);

export const normalizeProduct = (input = {}) => {
  const defaults = createProductDefaults();
  const product = { ...defaults, ...input, visual: { ...defaults.visual, ...(input.visual || {}) } };
  const stringFields = [
    "id", "slug", "name", "summary", "description", "image", "imageAlt", "categorySlug",
    "recommendationReason", "updatedAt", "reviewedAt", "imageSource", "imageLicense",
    "marketplaceProductId", "affiliateDisclosureVariant",
  ];
  stringFields.forEach((field) => { product[field] = String(product[field] || "").trim(); });
  ["collectionSlugs", "pros", "considerations", "suitableFor", "notSuitableFor", "keywords", "aliases"].forEach((field) => {
    product[field] = cleanStrings(product[field]);
  });
  product.affiliateLinks = Array.isArray(product.affiliateLinks) ? product.affiliateLinks.map((link) => ({
    ...link,
    marketplace: String(link?.marketplace || "").trim(),
    label: String(link?.label || "").trim(),
    url: String(link?.url || "").trim(),
    status: link?.status === "inactive" ? "inactive" : "active",
    isPrimary: Boolean(link?.isPrimary),
  })) : [];
  product.contentReferences = Array.isArray(product.contentReferences) ? product.contentReferences.map((reference) => ({
    ...reference,
    platform: String(reference?.platform || "").trim(),
    label: String(reference?.label || "").trim(),
    url: String(reference?.url || "").trim(),
    publishedAt: String(reference?.publishedAt || "").trim(),
  })) : [];
  product.featured = Boolean(product.featured);
  product.newest = Boolean(product.newest);
  product.demo = Boolean(product.demo);
  product.sortOrder = Number.isFinite(Number(product.sortOrder)) ? Number(product.sortOrder) : 999;
  product.imageWidth = Number.isFinite(Number(product.imageWidth)) ? Number(product.imageWidth) : 0;
  product.imageHeight = Number.isFinite(Number(product.imageHeight)) ? Number(product.imageHeight) : 0;
  product.status = product.status === "published" ? "published" : "draft";
  return product;
};
