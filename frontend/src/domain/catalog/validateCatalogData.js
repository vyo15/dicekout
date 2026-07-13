import { getMarketplace, hostnameMatchesMarketplace } from "../../config/marketplaces.js";
import {
  productPaletteById,
  PRODUCT_IMAGE_FITS,
  PRODUCT_IMAGE_POSITIONS,
  PRODUCT_IMAGE_SCALES,
} from "../../config/productPalettes.js";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
export const isSafeRelativeCatalogPath = (value) => typeof value === "string"
  && Boolean(value)
  && !value.startsWith("/")
  && !value.includes("..")
  && !/^[a-z][a-z0-9+.-]*:/i.test(value);

export const parseSafeExternalUrl = (value) => {
  try {
    const parsed = new URL(String(value || "").trim());
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const validateCatalogData = ({ site, categories, collections, products }) => {
  const errors = [];
  const warnings = [];
  const isLive = site?.catalogMode === "live";
  const requiredString = (value, label) => {
    if (typeof value !== "string" || !value.trim()) errors.push(`${label} wajib berupa teks yang tidak kosong.`);
  };
  const optionalString = (value, label) => {
    if (value !== undefined && typeof value !== "string") errors.push(`${label} harus berupa teks.`);
  };
  const ensureUnique = (items, key, label) => {
    const seen = new Set();
    for (const item of items || []) {
      const value = item?.[key];
      if (seen.has(value)) errors.push(`${label} duplikat: ${value}`);
      seen.add(value);
    }
  };
  const ensureStringArray = (value, label, { min = 0 } = {}) => {
    if (!Array.isArray(value)) { errors.push(`${label} harus array.`); return; }
    if (value.length < min) errors.push(`${label} minimal berisi ${min} item.`);
    value.forEach((item, index) => {
      if (typeof item !== "string" || !item.trim()) errors.push(`${label}[${index}] harus teks yang tidak kosong.`);
    });
  };
  const validateDate = (value, label, { required = false } = {}) => {
    if (!value && !required) return;
    if (typeof value !== "string" || !isoDatePattern.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
      errors.push(`${label} harus tanggal ISO YYYY-MM-DD yang valid.`);
    }
  };

  if (!site || !Array.isArray(categories) || !Array.isArray(collections) || !Array.isArray(products)) {
    return { errors: ["Payload katalog tidak lengkap."], warnings };
  }
  requiredString(site.brandName, "site.brandName"); requiredString(site.domain, "site.domain");
  requiredString(site.title, "site.title"); requiredString(site.description, "site.description");
  optionalString(site.contactEmail, "site.contactEmail"); optionalString(site.operatorName, "site.operatorName");
  validateDate(site.policyEffectiveAt, "site.policyEffectiveAt", { required: isLive });
  validateDate(site.policyUpdatedAt, "site.policyUpdatedAt", { required: isLive });
  if (!["demo", "live"].includes(site.catalogMode)) errors.push("site.catalogMode harus demo atau live.");
  if (typeof site.allowIndexing !== "boolean") errors.push("site.allowIndexing harus boolean.");
  if (site.allowIndexing && !isLive) errors.push("Indexing tidak boleh aktif ketika catalogMode masih demo.");
  if (isLive) { requiredString(site.contactEmail, "site.contactEmail untuk mode live"); requiredString(site.operatorName, "site.operatorName untuk mode live"); }

  ensureUnique(categories, "id", "ID kategori"); ensureUnique(categories, "slug", "Slug kategori");
  ensureUnique(collections, "id", "ID koleksi"); ensureUnique(collections, "slug", "Slug koleksi");
  ensureUnique(products, "id", "ID produk"); ensureUnique(products, "slug", "Slug produk");
  const categorySlugs = new Set(categories.map((item) => item.slug));
  const collectionSlugs = new Set(collections.map((item) => item.slug));
  const productIds = new Set(products.map((item) => item.id));
  const seenAffiliateUrls = new Map();

  for (const category of categories) {
    requiredString(category.id, "category.id"); requiredString(category.slug, `category(${category.id}).slug`);
    requiredString(category.name, `category(${category.id}).name`); requiredString(category.description, `category(${category.id}).description`);
    if (!slugPattern.test(category.slug || "")) errors.push(`Slug kategori tidak valid: ${category.slug}`);
  }
  for (const collection of collections) {
    requiredString(collection.id, "collection.id"); requiredString(collection.slug, `collection(${collection.id}).slug`);
    requiredString(collection.name, `collection(${collection.id}).name`); requiredString(collection.description, `collection(${collection.id}).description`);
    if (!slugPattern.test(collection.slug || "")) errors.push(`Slug koleksi tidak valid: ${collection.slug}`);
    if (!["draft", "published"].includes(collection.status)) errors.push(`Status koleksi tidak valid: ${collection.slug}`);
    if (!Array.isArray(collection.productIds)) errors.push(`collection(${collection.slug}).productIds harus array.`);
    for (const productId of collection.productIds || []) if (!productIds.has(productId)) errors.push(`Koleksi ${collection.slug} merujuk produk yang tidak ada: ${productId}`);
  }

  for (const product of products) {
    const prefix = `product(${product.id || "unknown"})`;
    ["id", "slug", "name", "summary", "description", "image", "imageAlt", "categorySlug", "recommendationReason"].forEach((field) => requiredString(product[field], `${prefix}.${field}`));
    if (!slugPattern.test(product.slug || "")) errors.push(`Slug produk tidak valid: ${product.slug}`);
    if (!categorySlugs.has(product.categorySlug)) errors.push(`${prefix} memakai kategori yang tidak ada: ${product.categorySlug}`);
    if (!["draft", "published"].includes(product.status)) errors.push(`${prefix}.status harus draft atau published.`);
    if (!isSafeRelativeCatalogPath(product.image)) errors.push(`${prefix}.image harus path lokal relatif yang aman.`);
    validateDate(product.updatedAt, `${prefix}.updatedAt`, { required: true });
    const publishedLive = isLive && product.status === "published" && !product.demo;
    validateDate(product.reviewedAt, `${prefix}.reviewedAt`, { required: publishedLive });
    for (const field of ["collectionSlugs", "pros", "considerations", "suitableFor", "notSuitableFor", "keywords", "aliases", "affiliateLinks", "contentReferences"]) {
      if (!Array.isArray(product[field])) errors.push(`${prefix}.${field} harus array.`);
    }
    const visual = product.visual || {};
    if (!productPaletteById.has(visual.paletteId || "neutral")) errors.push(`${prefix}.visual.paletteId tidak terdaftar.`);
    if (!PRODUCT_IMAGE_FITS.includes(visual.imageFit || "contain")) errors.push(`${prefix}.visual.imageFit tidak valid.`);
    if (!PRODUCT_IMAGE_SCALES.includes(visual.imageScale || "medium")) errors.push(`${prefix}.visual.imageScale tidak valid.`);
    if (!PRODUCT_IMAGE_POSITIONS.includes(visual.imagePosition || "center")) errors.push(`${prefix}.visual.imagePosition tidak valid.`);
    if (publishedLive) {
      ensureStringArray(product.pros, `${prefix}.pros`, { min: 1 }); ensureStringArray(product.considerations, `${prefix}.considerations`, { min: 1 });
      ensureStringArray(product.suitableFor, `${prefix}.suitableFor`, { min: 1 }); ensureStringArray(product.notSuitableFor, `${prefix}.notSuitableFor`, { min: 1 });
      requiredString(product.imageSource, `${prefix}.imageSource`); requiredString(product.imageLicense, `${prefix}.imageLicense`);
      if (!Number.isInteger(product.imageWidth) || product.imageWidth < 600) errors.push(`${prefix}.imageWidth minimal 600px untuk produk live.`);
      if (!Number.isInteger(product.imageHeight) || product.imageHeight < 600) errors.push(`${prefix}.imageHeight minimal 600px untuk produk live.`);
      if (!product.affiliateLinks?.some((link) => link.status !== "inactive")) errors.push(`${prefix} wajib memiliki minimal satu affiliate link aktif.`);
      if (/\.svg$/i.test(product.image)) errors.push(`${prefix} masih memakai SVG; gunakan foto WebP/JPEG/PNG berizin untuk produk live.`);
    }
    for (const collectionSlug of product.collectionSlugs || []) {
      if (!collectionSlugs.has(collectionSlug)) errors.push(`${prefix} merujuk koleksi yang tidak ada: ${collectionSlug}`);
      const collection = collections.find((item) => item.slug === collectionSlug);
      if (collection && !collection.productIds.includes(product.id)) errors.push(`Relasi tidak sinkron: ${product.id} mencantumkan ${collectionSlug}, tetapi koleksi tidak mencantumkan produk.`);
    }
    const marketplaceIds = new Set();
    for (const [index, link] of (product.affiliateLinks || []).entries()) {
      const linkPrefix = `${prefix}.affiliateLinks[${index}]`;
      requiredString(link.marketplace, `${linkPrefix}.marketplace`); requiredString(link.url, `${linkPrefix}.url`);
      const marketplace = getMarketplace(link.marketplace);
      if (!marketplace) { errors.push(`${linkPrefix}.marketplace tidak terdaftar: ${link.marketplace}`); continue; }
      if (marketplaceIds.has(link.marketplace)) errors.push(`${prefix} memiliki marketplace duplikat: ${link.marketplace}`);
      marketplaceIds.add(link.marketplace);
      const parsed = parseSafeExternalUrl(link.url);
      if (!parsed) errors.push(`${prefix} memiliki affiliate URL tidak aman: ${link.url}`);
      else if (!hostnameMatchesMarketplace(parsed.hostname, marketplace)) errors.push(`${linkPrefix}.url tidak cocok dengan hostname marketplace ${marketplace.label}: ${parsed.hostname}`);
      if (link.status && !["active", "inactive"].includes(link.status)) errors.push(`${linkPrefix}.status tidak valid.`);
      if (link.label !== undefined && typeof link.label !== "string") errors.push(`${linkPrefix}.label harus teks.`);
      const exactUrl = String(link.url || "").trim();
      if (exactUrl) {
        const previous = seenAffiliateUrls.get(exactUrl);
        if (previous && previous !== product.id) errors.push(`Affiliate URL yang sama dipakai produk berbeda: ${previous} dan ${product.id}.`);
        seenAffiliateUrls.set(exactUrl, product.id);
      }
    }
    for (const [index, reference] of (product.contentReferences || []).entries()) {
      const refPrefix = `${prefix}.contentReferences[${index}]`;
      requiredString(reference.platform, `${refPrefix}.platform`); requiredString(reference.label, `${refPrefix}.label`);
      if (!parseSafeExternalUrl(reference.url)) errors.push(`${refPrefix}.url tidak aman.`);
      validateDate(reference.publishedAt, `${refPrefix}.publishedAt`);
    }
    if (site.allowIndexing && product.status === "published" && product.demo) errors.push(`Produk demo tidak boleh dipublikasikan saat indexing aktif: ${product.slug}`);
  }
  for (const collection of collections) {
    for (const productId of collection.productIds || []) {
      const product = products.find((item) => item.id === productId);
      if (product && !(product.collectionSlugs || []).includes(collection.slug)) errors.push(`Relasi tidak sinkron: koleksi ${collection.slug} mencantumkan ${productId}, tetapi produk tidak mencantumkan koleksi.`);
    }
    if (site.allowIndexing && collection.status === "published" && collection.demo) errors.push(`Koleksi demo tidak boleh dipublikasikan saat indexing aktif: ${collection.slug}`);
  }
  return { errors, warnings };
};
