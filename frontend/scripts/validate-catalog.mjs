import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "src", "data");

const readJson = async (name) => JSON.parse(await readFile(path.join(dataDir, name), "utf8"));
const errors = [];

const [site, categories, collections, products] = await Promise.all([
  readJson("site.json"),
  readJson("categories.json"),
  readJson("collections.json"),
  readJson("products.json"),
]);

const requiredString = (value, label) => {
  if (typeof value !== "string" || !value.trim()) errors.push(`${label} wajib berupa teks yang tidak kosong.`);
};

const ensureUnique = (items, key, label) => {
  const seen = new Set();
  for (const item of items) {
    const value = item[key];
    if (seen.has(value)) errors.push(`${label} duplikat: ${value}`);
    seen.add(value);
  }
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const safeRelativePath = (value) => typeof value === "string"
  && !value.startsWith("/")
  && !value.includes("..")
  && !/^[a-z][a-z0-9+.-]*:/i.test(value);

const safeExternalUrl = (value) => {
  try {
    const parsed = new URL(String(value || "").trim());
    return ["http:", "https:"].includes(parsed.protocol) && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
};

requiredString(site.brandName, "site.brandName");
requiredString(site.domain, "site.domain");
requiredString(site.title, "site.title");
requiredString(site.description, "site.description");
if (!["demo", "live"].includes(site.catalogMode)) errors.push("site.catalogMode harus demo atau live.");
if (typeof site.allowIndexing !== "boolean") errors.push("site.allowIndexing harus boolean.");
if (site.allowIndexing && site.catalogMode !== "live") {
  errors.push("Indexing tidak boleh aktif ketika catalogMode masih demo.");
}

ensureUnique(categories, "id", "ID kategori");
ensureUnique(categories, "slug", "Slug kategori");
ensureUnique(collections, "id", "ID koleksi");
ensureUnique(collections, "slug", "Slug koleksi");
ensureUnique(products, "id", "ID produk");
ensureUnique(products, "slug", "Slug produk");

const categorySlugs = new Set(categories.map((item) => item.slug));
const collectionSlugs = new Set(collections.map((item) => item.slug));
const productIds = new Set(products.map((item) => item.id));

for (const category of categories) {
  requiredString(category.id, "category.id");
  requiredString(category.slug, `category(${category.id}).slug`);
  requiredString(category.name, `category(${category.id}).name`);
  requiredString(category.description, `category(${category.id}).description`);
  if (!slugPattern.test(category.slug || "")) errors.push(`Slug kategori tidak valid: ${category.slug}`);
}

for (const collection of collections) {
  requiredString(collection.id, "collection.id");
  requiredString(collection.slug, `collection(${collection.id}).slug`);
  requiredString(collection.name, `collection(${collection.id}).name`);
  requiredString(collection.description, `collection(${collection.id}).description`);
  if (!slugPattern.test(collection.slug || "")) errors.push(`Slug koleksi tidak valid: ${collection.slug}`);
  if (!["draft", "published"].includes(collection.status)) errors.push(`Status koleksi tidak valid: ${collection.slug}`);
  if (!Array.isArray(collection.productIds)) errors.push(`collection(${collection.slug}).productIds harus array.`);
  for (const productId of collection.productIds || []) {
    if (!productIds.has(productId)) errors.push(`Koleksi ${collection.slug} merujuk produk yang tidak ada: ${productId}`);
  }
}

for (const product of products) {
  const prefix = `product(${product.id || "unknown"})`;
  ["id", "slug", "name", "summary", "description", "image", "imageAlt", "categorySlug", "recommendationReason"].forEach((field) => {
    requiredString(product[field], `${prefix}.${field}`);
  });

  if (!slugPattern.test(product.slug || "")) errors.push(`Slug produk tidak valid: ${product.slug}`);
  if (!categorySlugs.has(product.categorySlug)) errors.push(`${prefix} memakai kategori yang tidak ada: ${product.categorySlug}`);
  if (!["draft", "published"].includes(product.status)) errors.push(`${prefix}.status harus draft atau published.`);
  if (!safeRelativePath(product.image)) errors.push(`${prefix}.image harus path lokal relatif yang aman.`);

  for (const field of ["collectionSlugs", "pros", "considerations", "suitableFor", "keywords", "affiliateLinks"]) {
    if (!Array.isArray(product[field])) errors.push(`${prefix}.${field} harus array.`);
  }

  for (const collectionSlug of product.collectionSlugs || []) {
    if (!collectionSlugs.has(collectionSlug)) errors.push(`${prefix} merujuk koleksi yang tidak ada: ${collectionSlug}`);
    const collection = collections.find((item) => item.slug === collectionSlug);
    if (collection && !collection.productIds.includes(product.id)) {
      errors.push(`Relasi tidak sinkron: ${product.id} mencantumkan ${collectionSlug}, tetapi koleksi tidak mencantumkan produk.`);
    }
  }

  for (const link of product.affiliateLinks || []) {
    requiredString(link.marketplace, `${prefix}.affiliateLinks.marketplace`);
    requiredString(link.label, `${prefix}.affiliateLinks.label`);
    requiredString(link.url, `${prefix}.affiliateLinks.url`);
    if (!safeExternalUrl(link.url)) errors.push(`${prefix} memiliki affiliate URL tidak aman: ${link.url}`);
    if (link.status && !["active", "inactive"].includes(link.status)) errors.push(`${prefix} memiliki status link tidak valid.`);
  }

  if (site.allowIndexing && product.status === "published" && product.demo) {
    errors.push(`Produk demo tidak boleh dipublikasikan saat indexing aktif: ${product.slug}`);
  }
}

for (const collection of collections) {
  for (const productId of collection.productIds || []) {
    const product = products.find((item) => item.id === productId);
    if (product && !(product.collectionSlugs || []).includes(collection.slug)) {
      errors.push(`Relasi tidak sinkron: koleksi ${collection.slug} mencantumkan ${productId}, tetapi produk tidak mencantumkan koleksi.`);
    }
  }
  if (site.allowIndexing && collection.status === "published" && collection.demo) {
    errors.push(`Koleksi demo tidak boleh dipublikasikan saat indexing aktif: ${collection.slug}`);
  }
}

if (errors.length) {
  console.error("Validasi katalog gagal:\n");
  errors.forEach((error, index) => console.error(`${index + 1}. ${error}`));
  process.exit(1);
}

console.log(`Katalog valid: ${products.length} produk, ${categories.length} kategori, ${collections.length} koleksi.`);
