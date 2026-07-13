import { access, readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { validateCatalogData, isSafeRelativeCatalogPath } from "../src/domain/catalog/validateCatalogData.js";

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(frontendDir, "src", "data");
const publicDir = path.join(frontendDir, "public");
const readJson = async (name) => JSON.parse(await readFile(path.join(dataDir, name), "utf8"));
const [site, categories, collections, products] = await Promise.all([
  readJson("site.json"), readJson("categories.json"), readJson("collections.json"), readJson("products.json"),
]);
const result = validateCatalogData({ site, categories, collections, products });
for (const product of products) {
  if (!isSafeRelativeCatalogPath(product.image)) continue;
  const imagePath = path.resolve(publicDir, product.image);
  if (!imagePath.startsWith(`${publicDir}${path.sep}`)) {
    result.errors.push(`product(${product.id}).image keluar dari folder public.`);
    continue;
  }
  try {
    await access(imagePath);
    const imageStat = await stat(imagePath);
    if (imageStat.size > 750 * 1024) result.warnings.push(`product(${product.id}).image berukuran lebih dari 750KB.`);
  } catch {
    result.errors.push(`product(${product.id}).image tidak ditemukan: ${product.image}`);
  }
}
if (result.warnings.length) {
  console.warn("Peringatan katalog:\n");
  result.warnings.forEach((warning, index) => console.warn(`${index + 1}. ${warning}`));
  console.warn("");
}
if (result.errors.length) {
  console.error("Validasi katalog gagal:\n");
  result.errors.forEach((error, index) => console.error(`${index + 1}. ${error}`));
  process.exit(1);
}
console.log(`Katalog valid: ${products.length} produk, ${categories.length} kategori, ${collections.length} koleksi.`);
