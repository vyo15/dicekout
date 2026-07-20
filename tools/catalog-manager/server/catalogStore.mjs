import path from "node:path";
import { readFile } from "node:fs/promises";
import { resolveContainedPath } from "./security.mjs";
import { validateCatalogData, normalizeProduct } from "../../../frontend/src/shared/catalogDomain.js";
import {
  exists,
  relativeProductMediaName,
  sha256,
} from "./catalogRepositoryUtils.mjs";

export const createCatalogStore = ({ dataDir, mediaDir }) => {
  const dataPath = (name) => path.join(dataDir, name);
  const readJsonFile = async (file) => JSON.parse(await readFile(file, "utf8"));
  const readJson = async (name) => readJsonFile(dataPath(name));

  const readCatalog = async () => {
    const [site, categories, collections, products] = await Promise.all([
      readJson("site.json"),
      readJson("categories.json"),
      readJson("collections.json"),
      readJson("products.json"),
    ]);
    return { site, categories, collections, products };
  };

  const catalogFingerprint = (catalog) => sha256(JSON.stringify({
    products: catalog.products,
    collections: catalog.collections,
  }));

  const validateMediaReferences = async (catalog) => {
    const missing = [];
    for (const product of catalog.products) {
      const name = relativeProductMediaName(product.image);
      if (!name) continue;
      const file = await resolveContainedPath(mediaDir, name);
      if (!await exists(file)) missing.push(`${product.id}: ${product.image}`);
    }
    if (missing.length) throw new Error(`Media produk tidak ditemukan:\n${missing.join("\n")}`);
  };

  const buildCandidate = (catalog, product) => {
    const normalized = normalizeProduct(product);
    const idIndex = catalog.products.findIndex((item) => item.id === normalized.id);
    const slugIndex = catalog.products.findIndex((item) => item.slug === normalized.slug);
    if (idIndex >= 0 && catalog.products[idIndex].slug !== normalized.slug) {
      return {
        errors: [`Slug produk yang sudah ada tidak boleh diubah: ${catalog.products[idIndex].slug}.`],
        warnings: [],
        normalized,
        catalog,
      };
    }
    if (slugIndex >= 0 && catalog.products[slugIndex].id !== normalized.id) {
      return {
        errors: [`Slug sudah dipakai produk lain: ${normalized.slug}.`],
        warnings: [],
        normalized,
        catalog,
      };
    }
    if (idIndex >= 0 && slugIndex >= 0 && idIndex !== slugIndex) {
      return {
        errors: [`ID dan slug mengarah ke dua produk berbeda: ${normalized.id} / ${normalized.slug}.`],
        warnings: [],
        normalized,
        catalog,
      };
    }
    const existingIndex = idIndex >= 0 ? idIndex : slugIndex;
    const products = existingIndex >= 0
      ? catalog.products.map((item, index) => index === existingIndex ? normalized : item)
      : [...catalog.products, normalized];
    const collections = catalog.collections.map((collection) => ({
      ...collection,
      productIds: (collection.productIds || []).filter((id) => id !== normalized.id),
    }));
    for (const slug of normalized.collectionSlugs) {
      const collection = collections.find((item) => item.slug === slug);
      if (collection && !collection.productIds.includes(normalized.id)) collection.productIds.push(normalized.id);
    }
    const candidateCatalog = { ...catalog, products, collections };
    return {
      ...validateCatalogData(candidateCatalog),
      normalized,
      catalog: candidateCatalog,
    };
  };

  const validateCandidate = async (product, baseCatalog = null) => buildCandidate(baseCatalog || await readCatalog(), product);

  return {
    dataPath,
    readJsonFile,
    readCatalog,
    catalogFingerprint,
    validateMediaReferences,
    buildCandidate,
    validateCandidate,
  };
};
