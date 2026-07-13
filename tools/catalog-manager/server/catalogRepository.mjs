import path from "node:path";
import { readFile, mkdir, copyFile, rename, rm } from "node:fs/promises";
import { atomicWriteJson } from "./atomicWrite.mjs";
import { validateCatalogData } from "../../../frontend/src/domain/catalog/validateCatalogData.js";
import { normalizeProduct } from "../../../frontend/src/domain/catalog/normalizeProduct.js";

export const createCatalogRepository = (projectRoot) => {
  const dataDir = path.join(projectRoot, "frontend", "src", "data");
  const mediaDir = path.join(projectRoot, "frontend", "public", "images", "products");
  const stateDir = path.join(projectRoot, ".catalog-manager");
  const draftsDir = path.join(stateDir, "drafts");
  const backupsDir = path.join(stateDir, "backups");
  const tempDir = path.join(stateDir, "temp");
  const readJson = async (file) => JSON.parse(await readFile(path.join(dataDir, file), "utf8"));
  const readCatalog = async () => {
    const [site, categories, collections, products] = await Promise.all([readJson("site.json"), readJson("categories.json"), readJson("collections.json"), readJson("products.json")]);
    return { site, categories, collections, products };
  };
  const ensureDirs = () => Promise.all([stateDir, draftsDir, backupsDir, tempDir, mediaDir].map((dir) => mkdir(dir, { recursive: true })));
  const validateCandidate = async (product) => {
    const catalog = await readCatalog();
    const normalized = normalizeProduct(product);
    const exists = catalog.products.findIndex((item) => item.id === normalized.id || item.slug === normalized.slug);
    const products = exists >= 0 ? catalog.products.map((item, index) => index === exists ? normalized : item) : [...catalog.products, normalized];
    const collections = catalog.collections.map((collection) => ({ ...collection, productIds: collection.productIds.filter((id) => id !== normalized.id) }));
    for (const slug of normalized.collectionSlugs) {
      const collection = collections.find((item) => item.slug === slug);
      if (collection && !collection.productIds.includes(normalized.id)) collection.productIds.push(normalized.id);
    }
    const result = validateCatalogData({ ...catalog, products, collections });
    return { ...result, normalized, catalog: { ...catalog, products, collections } };
  };
  const backup = async (catalog) => {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const dir = path.join(backupsDir, stamp);
    await mkdir(dir, { recursive: true });
    await Promise.all(Object.entries({ "products.json": catalog.products, "collections.json": catalog.collections }).map(([name,value]) => atomicWriteJson(path.join(dir,name), value)));
    return stamp;
  };
  return {
    paths: { dataDir, mediaDir, stateDir, draftsDir, backupsDir, tempDir }, ensureDirs, readCatalog, validateCandidate,
    async saveDraft(product) { await ensureDirs(); const normalized = normalizeProduct(product); const key = normalized.id || normalized.slug || `draft-${Date.now()}`; await atomicWriteJson(path.join(draftsDir, `${key}.json`), normalized); return key; },
    async listDrafts() { await ensureDirs(); const { readdir } = await import("node:fs/promises"); const names = await readdir(draftsDir); return Promise.all(names.filter((n)=>n.endsWith(".json")).map(async n=>JSON.parse(await readFile(path.join(draftsDir,n),"utf8")))); },
    async apply(product, tempMedia) {
      await ensureDirs(); const checked = await validateCandidate(product); if (checked.errors.length) return checked;
      const backupId = await backup(await readCatalog());
      if (tempMedia?.tempName && tempMedia?.finalName) {
        await rename(path.join(tempDir,tempMedia.tempName), path.join(mediaDir,tempMedia.finalName));
        checked.normalized.image = `images/products/${tempMedia.finalName}`;
      }
      const finalChecked = await validateCandidate(checked.normalized); if (finalChecked.errors.length) throw new Error(finalChecked.errors.join("\n"));
      await atomicWriteJson(path.join(dataDir,"products.json"), finalChecked.catalog.products);
      await atomicWriteJson(path.join(dataDir,"collections.json"), finalChecked.catalog.collections);
      return { ...finalChecked, backupId };
    },
    async importTempMedia({ buffer, finalName }) { await ensureDirs(); const tempName = `${Date.now()}-${Math.random().toString(16).slice(2)}.upload`; await import("node:fs/promises").then(({writeFile})=>writeFile(path.join(tempDir,tempName),buffer,{flag:"wx"})); return { tempName, finalName }; },
    async rollback(backupId) { const dir=path.join(backupsDir,path.basename(backupId)); await copyFile(path.join(dir,"products.json"),path.join(dataDir,"products.json")); await copyFile(path.join(dir,"collections.json"),path.join(dataDir,"collections.json")); return true; },
    async removeTemp(name) { await rm(path.join(tempDir,path.basename(name)),{force:true}); }
  };
};
