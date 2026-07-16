import crypto from "node:crypto";
import path from "node:path";
import {
  access,
  copyFile,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { atomicReplaceJsonFiles, atomicWriteJson } from "./atomicWrite.mjs";
import { assertSafeBasename, resolveContainedPath } from "./security.mjs";
import { validateCatalogData } from "../../../frontend/src/domain/catalog/validateCatalogData.js";
import { normalizeProduct, slugifyProductName } from "../../../frontend/src/domain/catalog/normalizeProduct.js";

const DRAFT_VERSION = 1;
const BACKUP_VERSION = 2;
const MIN_SUPPORTED_BACKUP_VERSION = 1;
const DELETE_BACKUP_RETENTION = 5;
const TEMP_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const TEMP_MAX_FILES = 20;
const PRODUCT_MEDIA_PREFIX = "images/products/";
const PROTECTED_PRODUCT_MEDIA = new Set(["fallback.svg"]);

const exists = async (file) => access(file).then(() => true).catch(() => false);
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const timestamp = () => new Date().toISOString().replace(/[:.]/g, "-");
const safeOperationToken = (value) => String(value || "operation")
  .toLowerCase()
  .replace(/[^a-z0-9-]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 72) || "operation";
const clone = (value) => structuredClone(value);
const relativeProductMediaName = (imagePath) => {
  const value = String(imagePath || "");
  if (!value.startsWith(PRODUCT_MEDIA_PREFIX)) return null;
  const name = value.slice(PRODUCT_MEDIA_PREFIX.length);
  return name && name === path.basename(name) ? name : null;
};

export const createCatalogRepository = (projectRoot) => {
  const dataDir = path.join(projectRoot, "frontend", "src", "data");
  const mediaDir = path.join(projectRoot, "frontend", "public", "images", "products");
  const stateDir = path.join(projectRoot, ".catalog-manager");
  const draftsDir = path.join(stateDir, "drafts");
  const backupsDir = path.join(stateDir, "backups");
  const tempDir = path.join(stateDir, "temp");
  const transactionsDir = path.join(stateDir, "transactions");
  let activeMutation = null;

  const dataPath = (name) => path.join(dataDir, name);
  const readJsonFile = async (file) => JSON.parse(await readFile(file, "utf8"));
  const readJson = async (name) => readJsonFile(dataPath(name));
  const ensureDirs = async () => {
    await Promise.all([stateDir, draftsDir, backupsDir, tempDir, transactionsDir, mediaDir].map((dir) => mkdir(dir, { recursive: true })));
  };

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
    const existsIndex = idIndex >= 0 ? idIndex : slugIndex;
    const products = existsIndex >= 0
      ? catalog.products.map((item, index) => index === existsIndex ? normalized : item)
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

  const runMutation = async (name, operation) => {
    if (activeMutation) throw new Error(`Operasi ${activeMutation} sedang berjalan. Tunggu sampai selesai.`);
    activeMutation = name;
    try {
      return await operation();
    } finally {
      activeMutation = null;
    }
  };

  const draftKeyFromProduct = (product) => {
    const key = slugifyProductName(product.id || product.slug) || `draft-${Date.now()}`;
    const safe = safeOperationToken(key);
    if (!safe) throw new Error("Draft belum memiliki ID atau slug yang valid.");
    return safe;
  };

  const parseDraftRecord = async (fileName) => {
    const file = await resolveContainedPath(draftsDir, assertSafeBasename(fileName, "Nama draft"));
    const raw = await readJsonFile(file);
    const envelope = raw?.version === DRAFT_VERSION && raw?.product
      ? raw
      : { version: 0, product: raw, tempMedia: null, savedAt: "" };
    return {
      key: path.basename(fileName, ".json"),
      file,
      product: normalizeProduct(envelope.product),
      tempMedia: envelope.tempMedia || null,
      savedAt: String(envelope.savedAt || ""),
    };
  };

  const listDraftRecords = async () => {
    await ensureDirs();
    const names = (await readdir(draftsDir)).filter((name) => name.endsWith(".json"));
    const records = [];
    for (const name of names) {
      try {
        records.push(await parseDraftRecord(name));
      } catch {
        // Invalid drafts remain on disk for manual inspection but are not loaded into the editor.
      }
    }
    return records.sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt)));
  };

  const listDrafts = async () => (await listDraftRecords()).map((record) => ({
    ...record.product,
    _draft: {
      key: record.key,
      savedAt: record.savedAt,
      tempMedia: record.tempMedia,
    },
  }));

  const tempNamesReferencedByDrafts = async () => new Set(
    (await listDraftRecords())
      .map((record) => record.tempMedia?.tempName)
      .filter(Boolean),
  );

  const removeTempIfUnreferenced = async (name) => {
    if (!name) return false;
    const safeName = assertSafeBasename(name, "Nama media temporary");
    const references = await tempNamesReferencedByDrafts();
    if (references.has(safeName)) return false;
    const file = await resolveContainedPath(tempDir, safeName);
    await rm(file, { force: true });
    return true;
  };

  const cleanupTempMedia = async () => {
    await ensureDirs();
    const referenced = await tempNamesReferencedByDrafts();
    const entries = [];
    for (const name of await readdir(tempDir)) {
      const file = await resolveContainedPath(tempDir, assertSafeBasename(name, "Nama media temporary"));
      const info = await stat(file).catch(() => null);
      if (info?.isFile()) entries.push({ name, file, mtimeMs: info.mtimeMs });
    }
    const unreferenced = entries.filter((entry) => !referenced.has(entry.name)).sort((a, b) => a.mtimeMs - b.mtimeMs);
    const now = Date.now();
    for (const entry of unreferenced) {
      if (now - entry.mtimeMs > TEMP_MAX_AGE_MS) await rm(entry.file, { force: true });
    }
    const remaining = [];
    for (const entry of unreferenced) if (await exists(entry.file)) remaining.push(entry);
    while (remaining.length > TEMP_MAX_FILES) {
      const entry = remaining.shift();
      await rm(entry.file, { force: true });
    }
  };

  const saveDraft = async (product, tempMedia) => runMutation("menyimpan draft", async () => {
    await ensureDirs();
    const verifiedTemp = await verifyTempMedia(tempMedia);
    const normalized = normalizeProduct(product);
    const key = draftKeyFromProduct(normalized);
    const target = await resolveContainedPath(draftsDir, `${key}.json`);
    const currentRecords = await listDraftRecords();
    const replacedRecords = currentRecords.filter((record) =>
      record.key === key
      || ((normalized.id && record.product.id === normalized.id) || (normalized.slug && record.product.slug === normalized.slug))
    );
    const duplicateRecords = replacedRecords.filter((record) => record.key !== key);
    const previousTempNames = [...new Set(replacedRecords.map((record) => record.tempMedia?.tempName).filter(Boolean))];
    await atomicWriteJson(target, {
      version: DRAFT_VERSION,
      savedAt: new Date().toISOString(),
      product: normalized,
      tempMedia: verifiedTemp ? {
        ...tempMedia,
        tempName: verifiedTemp.tempName,
        finalName: verifiedTemp.finalName,
        path: `${PRODUCT_MEDIA_PREFIX}${verifiedTemp.finalName}`,
        hash: verifiedTemp.hash,
      } : null,
    });
    for (const record of duplicateRecords) await rm(record.file, { force: true });
    for (const tempName of previousTempNames) {
      if (tempName !== verifiedTemp?.tempName) await removeTempIfUnreferenced(tempName);
    }
    await cleanupTempMedia();
    return key;
  });

  const deleteDraft = async (draftKey) => runMutation("menghapus draft", async () => {
    await ensureDirs();
    const key = safeOperationToken(assertSafeBasename(String(draftKey || ""), "ID draft"));
    const file = await resolveContainedPath(draftsDir, `${key}.json`);
    if (!await exists(file)) throw new Error("Draft tidak ditemukan.");
    const record = await parseDraftRecord(`${key}.json`);
    await rm(file, { force: true });
    if (record.tempMedia?.tempName) await removeTempIfUnreferenced(record.tempMedia.tempName);
    return { ok: true, key };
  });

  const importTempMedia = async ({ buffer, finalName, metadata }) => {
    await ensureDirs();
    const safeFinalName = assertSafeBasename(finalName, "Nama media final");
    if (!safeFinalName.endsWith(".webp")) throw new Error("Media hasil optimasi wajib WebP.");
    const tempName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.webp`;
    const file = await resolveContainedPath(tempDir, tempName);
    await writeFile(file, buffer, { flag: "wx" });
    return { tempName, finalName: safeFinalName, ...metadata };
  };

  const verifyTempMedia = async (tempMedia) => {
    if (tempMedia === null || tempMedia === undefined) return null;
    if (!tempMedia || typeof tempMedia !== "object" || !tempMedia.tempName || !tempMedia.finalName) {
      throw new Error("Referensi gambar temporary tidak lengkap. Unggah ulang gambar.");
    }
    const tempName = assertSafeBasename(tempMedia.tempName, "Nama media temporary");
    const finalName = assertSafeBasename(tempMedia.finalName, "Nama media final");
    if (!finalName.endsWith(".webp")) throw new Error("Media final wajib berformat WebP.");
    const expectedPath = `${PRODUCT_MEDIA_PREFIX}${finalName}`;
    if (tempMedia.path && tempMedia.path !== expectedPath) throw new Error("Path gambar temporary tidak cocok dengan nama file final.");
    const tempPath = await resolveContainedPath(tempDir, tempName);
    if (!await exists(tempPath)) throw new Error("Gambar temporary tidak ditemukan. Unggah ulang gambar.");
    const buffer = await readFile(tempPath);
    const hash = sha256(buffer);
    if (tempMedia.hash && tempMedia.hash !== hash) throw new Error("Checksum gambar temporary tidak cocok.");
    if (!finalName.endsWith(`${hash.slice(0, 12)}.webp`)) throw new Error("Nama gambar tidak cocok dengan checksum hasil optimasi.");
    return { tempName, finalName, tempPath, buffer, hash };
  };

  const mediaUsage = async (catalog, { excludeProductId = "", excludeDraftKeys = new Set() } = {}) => {
    const source = new Map();
    for (const product of catalog.products) {
      if (product.id === excludeProductId) continue;
      const name = relativeProductMediaName(product.image);
      if (!name) continue;
      const users = source.get(name) || [];
      users.push({ type: "product", id: product.id });
      source.set(name, users);
    }
    const temp = new Map();
    for (const draft of await listDraftRecords()) {
      if (excludeDraftKeys.has(draft.key)) continue;
      const name = relativeProductMediaName(draft.product.image);
      if (name) {
        const users = source.get(name) || [];
        users.push({ type: "draft", id: draft.key });
        source.set(name, users);
      }
      if (draft.tempMedia?.tempName) {
        const users = temp.get(draft.tempMedia.tempName) || [];
        users.push(draft.key);
        temp.set(draft.tempMedia.tempName, users);
      }
    }
    return { source, temp };
  };

  const createBackup = async ({ operation, catalog, product = null, mediaFiles = [], draftFiles = [], tempFiles = [], extra = {} }) => {
    await ensureDirs();
    const id = `${timestamp()}-${safeOperationToken(operation)}${product?.id ? `-${safeOperationToken(product.id)}` : ""}-${crypto.randomBytes(3).toString("hex")}`;
    const dir = await resolveContainedPath(backupsDir, id);
    const mediaBackupDir = path.join(dir, "media");
    const draftsBackupDir = path.join(dir, "drafts");
    const tempBackupDir = path.join(dir, "temp");
    await Promise.all([
      mkdir(dir, { recursive: true }),
      mkdir(mediaBackupDir, { recursive: true }),
      mkdir(draftsBackupDir, { recursive: true }),
      mkdir(tempBackupDir, { recursive: true }),
    ]);

    await Promise.all([
      atomicWriteJson(path.join(dir, "products.json"), catalog.products),
      atomicWriteJson(path.join(dir, "collections.json"), catalog.collections),
    ]);

    const copiedMedia = [];
    for (const file of mediaFiles) {
      if (!file || !await exists(file)) continue;
      const name = assertSafeBasename(path.basename(file), "Nama media backup");
      await copyFile(file, path.join(mediaBackupDir, name));
      copiedMedia.push(name);
    }

    const copiedDrafts = [];
    for (const file of draftFiles) {
      if (!file || !await exists(file)) continue;
      const name = assertSafeBasename(path.basename(file), "Nama draft backup");
      await copyFile(file, path.join(draftsBackupDir, name));
      copiedDrafts.push(name);
    }

    const copiedTemp = [];
    for (const file of tempFiles) {
      if (!file || !await exists(file)) continue;
      const name = assertSafeBasename(path.basename(file), "Nama media temporary backup");
      await copyFile(file, path.join(tempBackupDir, name));
      copiedTemp.push(name);
    }

    const manifest = {
      version: BACKUP_VERSION,
      id,
      operation,
      createdAt: new Date().toISOString(),
      product: product ? { id: product.id, slug: product.slug, name: product.name } : null,
      fingerprintBefore: catalogFingerprint(catalog),
      mediaBackedUp: copiedMedia,
      draftsBackedUp: copiedDrafts,
      tempBackedUp: copiedTemp,
      ...extra,
    };
    await atomicWriteJson(path.join(dir, "manifest.json"), manifest);
    return { id, dir, manifest };
  };

  const supportedBackupVersion = (version) => version === undefined
    || version === null
    || (Number.isInteger(version) && version >= MIN_SUPPORTED_BACKUP_VERSION && version <= BACKUP_VERSION);

  const inspectBackup = async (dir, currentCatalog, manifest = {}) => {
    if (!supportedBackupVersion(manifest.version)) {
      return { restorable: false, issue: `Versi backup ${manifest.version} belum didukung.` };
    }

    let products;
    let collections;
    try {
      [products, collections] = await Promise.all([
        readJsonFile(path.join(dir, "products.json")),
        readJsonFile(path.join(dir, "collections.json")),
      ]);
    } catch {
      return { restorable: false, issue: "products.json atau collections.json tidak tersedia/valid." };
    }

    const candidate = { ...currentCatalog, products, collections };
    const validation = validateCatalogData(candidate);
    if (validation.errors.length) {
      return { restorable: false, issue: "Isi backup tidak lolos validasi katalog." };
    }

    const backupFiles = [
      ["mediaBackedUp", "media", "media"],
      ["draftsBackedUp", "drafts", "draft"],
      ["tempBackedUp", "temp", "temporary media"],
    ];
    for (const [manifestKey, folder, label] of backupFiles) {
      const names = manifest[manifestKey] || [];
      if (!Array.isArray(names)) return { restorable: false, issue: `Daftar ${label} pada manifest tidak valid.` };
      for (const name of names) {
        let safeName;
        try {
          safeName = assertSafeBasename(name, `Nama ${label} backup`);
        } catch {
          return { restorable: false, issue: `Nama ${label} pada backup tidak aman.` };
        }
        if (!await exists(path.join(dir, folder, safeName))) {
          return { restorable: false, issue: `File ${label} yang tercantum pada manifest tidak lengkap.` };
        }
      }
    }

    const mediaBackupDir = path.join(dir, "media");
    for (const product of candidate.products) {
      const mediaName = relativeProductMediaName(product.image);
      if (!mediaName) continue;
      const currentFile = await resolveContainedPath(mediaDir, mediaName);
      const backupFile = path.join(mediaBackupDir, mediaName);
      if (!await exists(currentFile) && !await exists(backupFile)) {
        return { restorable: false, issue: "Backup tidak memiliki seluruh gambar produk yang dibutuhkan." };
      }
    }

    return { restorable: true, issue: "", products, collections, candidate };
  };

  const pruneDeleteBackups = async () => {
    const backups = await listBackups();
    const deleteBackups = backups.filter((backup) => backup.operation === "delete-product");
    for (const backup of deleteBackups.slice(DELETE_BACKUP_RETENTION)) {
      const dir = await resolveContainedPath(backupsDir, backup.id);
      await rm(dir, { recursive: true, force: true });
    }
  };

  const listBackups = async () => {
    await ensureDirs();
    const currentCatalog = await readCatalog();
    const result = [];
    for (const name of await readdir(backupsDir)) {
      const safeName = assertSafeBasename(name, "ID backup");
      const dir = await resolveContainedPath(backupsDir, safeName);
      const info = await stat(dir).catch(() => null);
      if (!info?.isDirectory()) continue;
      const manifestPath = path.join(dir, "manifest.json");
      if (await exists(manifestPath)) {
        try {
          const manifest = await readJsonFile(manifestPath);
          const inspection = await inspectBackup(dir, currentCatalog, manifest);
          result.push({ ...manifest, id: safeName, restorable: inspection.restorable, issue: inspection.issue });
          continue;
        } catch {
          result.push({ id: safeName, operation: "invalid", createdAt: "", restorable: false, issue: "manifest.json tidak valid." });
          continue;
        }
      }
      const inspection = await inspectBackup(dir, currentCatalog);
      result.push({
        id: safeName,
        operation: "legacy",
        createdAt: info.mtime.toISOString(),
        product: null,
        restorable: inspection.restorable,
        issue: inspection.issue,
      });
    }
    return result.sort((a, b) => String(b.createdAt || b.id).localeCompare(String(a.createdAt || a.id)));
  };

  const restoreBackupInternal = async (backupId, { createSafetyBackup = true } = {}) => {
    const id = assertSafeBasename(String(backupId || ""), "ID backup");
    const dir = await resolveContainedPath(backupsDir, id);
    if (!await exists(dir)) throw new Error("Backup tidak ditemukan.");
    const currentCatalog = await readCatalog();
    const manifestPath = path.join(dir, "manifest.json");
    const manifest = await exists(manifestPath) ? await readJsonFile(manifestPath) : {};
    const inspection = await inspectBackup(dir, currentCatalog, manifest);
    if (!inspection.restorable) throw new Error(`Backup tidak dapat dipulihkan: ${inspection.issue}`);
    const { products, collections, candidate } = inspection;
    let safetyBackup = null;
    if (createSafetyBackup) {
      const mediaFiles = [];
      for (const name of manifest.mediaAdded || []) {
        const file = await resolveContainedPath(mediaDir, assertSafeBasename(name, "Nama media saat ini"));
        if (await exists(file)) mediaFiles.push(file);
      }
      const draftFiles = [];
      for (const name of manifest.draftsBackedUp || []) {
        const file = await resolveContainedPath(draftsDir, assertSafeBasename(name, "Nama draft saat ini"));
        if (await exists(file)) draftFiles.push(file);
      }
      const tempFiles = [];
      for (const name of manifest.tempBackedUp || []) {
        const file = await resolveContainedPath(tempDir, assertSafeBasename(name, "Nama temporary saat ini"));
        if (await exists(file)) tempFiles.push(file);
      }
      safetyBackup = await createBackup({
        operation: "pre-rollback",
        catalog: currentCatalog,
        mediaFiles,
        draftFiles,
        tempFiles,
        extra: {
          rollbackTarget: id,
          mediaAdded: manifest.mediaBackedUp || [],
          draftsAdded: manifest.draftsBackedUp || [],
          tempAdded: manifest.tempBackedUp || [],
        },
      });
    }

    const mediaBackupDir = path.join(dir, "media");
    const draftsBackupDir = path.join(dir, "drafts");
    const tempBackupDir = path.join(dir, "temp");

    try {
      for (const name of manifest.mediaBackedUp || []) {
        const safeName = assertSafeBasename(name, "Nama media backup");
        const source = path.join(mediaBackupDir, safeName);
        if (await exists(source)) await copyFile(source, await resolveContainedPath(mediaDir, safeName));
      }
      for (const name of manifest.draftsBackedUp || []) {
        const safeName = assertSafeBasename(name, "Nama draft backup");
        const source = path.join(draftsBackupDir, safeName);
        if (await exists(source)) await copyFile(source, await resolveContainedPath(draftsDir, safeName));
      }
      for (const name of manifest.tempBackedUp || []) {
        const safeName = assertSafeBasename(name, "Nama media temporary backup");
        const source = path.join(tempBackupDir, safeName);
        if (await exists(source)) await copyFile(source, await resolveContainedPath(tempDir, safeName));
      }

      await atomicReplaceJsonFiles([
        { target: dataPath("products.json"), value: products },
        { target: dataPath("collections.json"), value: collections },
      ]);

      for (const name of manifest.mediaAdded || []) {
        const safeName = assertSafeBasename(name, "Nama media baru");
        const stillUsed = candidate.products.some((product) => relativeProductMediaName(product.image) === safeName);
        if (!stillUsed) await rm(await resolveContainedPath(mediaDir, safeName), { force: true });
      }
      for (const name of manifest.draftsAdded || []) {
        const safeName = assertSafeBasename(name, "Nama draft tambahan");
        if (!(manifest.draftsBackedUp || []).includes(safeName)) await rm(await resolveContainedPath(draftsDir, safeName), { force: true });
      }
      for (const name of manifest.tempAdded || []) {
        const safeName = assertSafeBasename(name, "Nama temporary tambahan");
        if (!(manifest.tempBackedUp || []).includes(safeName)) await rm(await resolveContainedPath(tempDir, safeName), { force: true });
      }

      const finalCatalog = await readCatalog();
      const finalValidation = validateCatalogData(finalCatalog);
      if (finalValidation.errors.length) throw new Error(`Rollback menghasilkan katalog tidak valid:
${finalValidation.errors.join("\n")}`);
      await validateMediaReferences(finalCatalog);
      await cleanupTempMedia();
      return { ok: true, backupId: id, safetyBackupId: safetyBackup?.id || null };
    } catch (error) {
      if (!safetyBackup) throw error;
      try {
        await restoreBackupInternal(safetyBackup.id, { createSafetyBackup: false });
      } catch (recoveryError) {
        throw new AggregateError(
          [error, recoveryError],
          "Rollback gagal dan pemulihan kondisi sebelumnya tidak lengkap. Backup pengaman dipertahankan di Riwayat backup.",
        );
      }
      throw error;
    }
  };

  const apply = async (product, tempMedia) => runMutation("menerapkan produk", async () => {
    await ensureDirs();
    const baseCatalog = await readCatalog();
    await validateMediaReferences(baseCatalog);
    const checked = buildCandidate(baseCatalog, product);
    if (checked.errors.length) return checked;

    const verifiedTemp = await verifyTempMedia(tempMedia);
    const normalized = clone(checked.normalized);
    if (verifiedTemp) {
      normalized.image = `${PRODUCT_MEDIA_PREFIX}${verifiedTemp.finalName}`;
      normalized.imageWidth = Number(tempMedia.optimized?.width || tempMedia.width || normalized.imageWidth || 0);
      normalized.imageHeight = Number(tempMedia.optimized?.height || tempMedia.height || normalized.imageHeight || 0);
    }

    const finalChecked = buildCandidate(baseCatalog, normalized);
    if (finalChecked.errors.length) return finalChecked;

    const previous = baseCatalog.products.find((item) => item.id === normalized.id) || null;
    const previousImageName = relativeProductMediaName(previous?.image);
    const nextImageName = relativeProductMediaName(normalized.image);
    const draftRecords = (await listDraftRecords()).filter((record) =>
      (normalized.id && record.product.id === normalized.id) || (normalized.slug && record.product.slug === normalized.slug)
    );
    const excludedDraftKeys = new Set(draftRecords.map((record) => record.key));
    const draftTempNames = [...new Set(draftRecords.map((record) => record.tempMedia?.tempName).filter(Boolean))];
    const draftTempPaths = [];
    for (const tempName of draftTempNames) {
      const tempPath = await resolveContainedPath(tempDir, assertSafeBasename(tempName, "Nama media temporary"));
      if (await exists(tempPath)) draftTempPaths.push(tempPath);
    }
    const usageAfter = await mediaUsage(finalChecked.catalog, { excludeDraftKeys: excludedDraftKeys });
    const oldImageExclusive = previousImageName
      && !PROTECTED_PRODUCT_MEDIA.has(previousImageName)
      && previousImageName !== nextImageName
      && !(usageAfter.source.get(previousImageName)?.length);
    const oldImagePath = oldImageExclusive ? await resolveContainedPath(mediaDir, previousImageName) : null;

    const backup = await createBackup({
      operation: "apply-product",
      catalog: baseCatalog,
      product: normalized,
      mediaFiles: oldImagePath ? [oldImagePath] : [],
      draftFiles: draftRecords.map((record) => record.file),
      tempFiles: [...new Set([...(verifiedTemp ? [verifiedTemp.tempPath] : []), ...draftTempPaths])],
      extra: {
        mediaAdded: verifiedTemp ? [verifiedTemp.finalName] : [],
        mediaRemoved: oldImagePath && await exists(oldImagePath) ? [previousImageName] : [],
        draftsRemoved: draftRecords.map((record) => path.basename(record.file)),
        tempRemoved: draftTempPaths.map((file) => path.basename(file)),
      },
    });

    let newMediaCreated = false;
    try {
      if (verifiedTemp) {
        const target = await resolveContainedPath(mediaDir, verifiedTemp.finalName);
        if (!await exists(target)) {
          await copyFile(verifiedTemp.tempPath, target);
          newMediaCreated = true;
        }
      }

      await atomicReplaceJsonFiles([
        { target: dataPath("products.json"), value: finalChecked.catalog.products },
        { target: dataPath("collections.json"), value: finalChecked.catalog.collections },
      ]);

      if (oldImagePath) await rm(oldImagePath, { force: true });
      for (const record of draftRecords) await rm(record.file, { force: true });
      for (const tempName of draftTempNames) await removeTempIfUnreferenced(tempName);
      if (verifiedTemp && !draftTempNames.includes(verifiedTemp.tempName)) await removeTempIfUnreferenced(verifiedTemp.tempName);

      const finalCatalog = await readCatalog();
      const finalValidation = validateCatalogData(finalCatalog);
      if (finalValidation.errors.length) throw new Error(finalValidation.errors.join("\n"));
      await validateMediaReferences(finalCatalog);
      await cleanupTempMedia();
      return { ...finalChecked, backupId: backup.id };
    } catch (error) {
      let recoveryError = null;
      try {
        await restoreBackupInternal(backup.id, { createSafetyBackup: false });
      } catch (caught) {
        recoveryError = caught;
      }
      if (newMediaCreated && verifiedTemp) await rm(await resolveContainedPath(mediaDir, verifiedTemp.finalName), { force: true }).catch(() => {});
      if (recoveryError) {
        throw new AggregateError(
          [error, recoveryError],
          "Penerapan produk gagal dan rollback otomatis tidak lengkap. Backup dipertahankan di Riwayat backup.",
        );
      }
      throw error;
    }
  });

  const analyzeDelete = async (productId) => {
    await ensureDirs();
    const catalog = await readCatalog();
    const matches = catalog.products.filter((item) => item.id === productId);
    if (matches.length !== 1) throw new Error(matches.length ? "ID produk duplikat. Perbaiki katalog sebelum menghapus." : "Produk tidak ditemukan.");
    const product = matches[0];
    const collectionMatches = catalog.collections.filter((collection) => (collection.productIds || []).includes(product.id));
    const draftMatches = (await listDraftRecords()).filter((record) =>
      record.product.id === product.id || (product.slug && record.product.slug === product.slug)
    );
    const imageName = relativeProductMediaName(product.image);
    const excludedDraftKeys = new Set(draftMatches.map((record) => record.key));
    const usage = await mediaUsage(catalog, { excludeProductId: product.id, excludeDraftKeys: excludedDraftKeys });
    const imageUsers = imageName ? (usage.source.get(imageName) || []) : [];
    return {
      fingerprint: catalogFingerprint(catalog),
      product: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        status: product.status,
        categorySlug: product.categorySlug,
        image: product.image,
        imageProtected: Boolean(imageName && PROTECTED_PRODUCT_MEDIA.has(imageName)),
        imageShared: imageUsers.length > 0,
        imageUsers: imageUsers.length,
        affiliateLinks: product.affiliateLinks?.length || 0,
        contentReferences: product.contentReferences?.length || 0,
      },
      collections: collectionMatches.map((collection) => ({ id: collection.id, slug: collection.slug, name: collection.name })),
      drafts: draftMatches.map((record) => ({ key: record.key, name: record.product.name, hasTempMedia: Boolean(record.tempMedia?.tempName) })),
    };
  };

  const deleteProduct = async ({ productId, fingerprint, confirmationName, confirmed }) => runMutation("menghapus produk", async () => {
    if (!confirmed) throw new Error("Konfirmasi penghapusan belum diberikan.");
    await ensureDirs();
    const catalog = await readCatalog();
    await validateMediaReferences(catalog);
    if (catalogFingerprint(catalog) !== fingerprint) throw new Error("Katalog berubah sejak analisis dilakukan. Muat ulang dampak penghapusan.");
    const matches = catalog.products.filter((item) => item.id === productId);
    if (matches.length !== 1) throw new Error(matches.length ? "ID produk duplikat. Penghapusan dibatalkan." : "Produk tidak ditemukan.");
    const product = matches[0];
    if (String(confirmationName || "") !== product.name) throw new Error("Nama konfirmasi tidak cocok dengan produk target.");

    const products = catalog.products.filter((item) => item.id !== product.id);
    const collections = catalog.collections.map((collection) => ({
      ...collection,
      productIds: (collection.productIds || []).filter((id) => id !== product.id),
    }));
    const candidate = { ...catalog, products, collections };
    const validation = validateCatalogData(candidate);
    if (validation.errors.length) throw new Error(`Penghapusan menghasilkan katalog tidak valid:\n${validation.errors.join("\n")}`);

    const draftMatches = (await listDraftRecords()).filter((record) =>
      record.product.id === product.id || (product.slug && record.product.slug === product.slug)
    );
    const imageName = relativeProductMediaName(product.image);
    const excludedDraftKeys = new Set(draftMatches.map((record) => record.key));
    const usageAfter = await mediaUsage(candidate, { excludeDraftKeys: excludedDraftKeys });
    const sourceImageExclusive = imageName
      && !PROTECTED_PRODUCT_MEDIA.has(imageName)
      && !(usageAfter.source.get(imageName)?.length);
    const sourceImagePath = sourceImageExclusive ? await resolveContainedPath(mediaDir, imageName) : null;
    const tempNames = [...new Set(draftMatches.map((record) => record.tempMedia?.tempName).filter(Boolean))];
    const tempPaths = [];
    const allDrafts = await listDraftRecords();
    for (const tempName of tempNames) {
      const usedByOtherDraft = allDrafts.some((record) =>
        !draftMatches.some((matched) => matched.key === record.key)
        && record.tempMedia?.tempName === tempName
      );
      if (!usedByOtherDraft) tempPaths.push(await resolveContainedPath(tempDir, assertSafeBasename(tempName, "Nama media temporary")));
    }

    const backup = await createBackup({
      operation: "delete-product",
      catalog,
      product,
      mediaFiles: sourceImagePath ? [sourceImagePath] : [],
      draftFiles: draftMatches.map((record) => record.file),
      tempFiles: tempPaths,
      extra: {
        collectionsChanged: catalog.collections.filter((collection) => (collection.productIds || []).includes(product.id)).map((collection) => collection.slug),
        mediaRemoved: sourceImagePath && await exists(sourceImagePath) ? [imageName] : [],
        draftsRemoved: draftMatches.map((record) => path.basename(record.file)),
        tempRemoved: tempPaths.map((file) => path.basename(file)),
      },
    });

    try {
      await atomicReplaceJsonFiles([
        { target: dataPath("products.json"), value: products },
        { target: dataPath("collections.json"), value: collections },
      ]);
      if (sourceImagePath) await rm(sourceImagePath, { force: true });
      for (const record of draftMatches) await rm(record.file, { force: true });
      for (const file of tempPaths) await rm(file, { force: true });

      const finalCatalog = await readCatalog();
      const finalValidation = validateCatalogData(finalCatalog);
      if (finalValidation.errors.length) throw new Error(finalValidation.errors.join("\n"));
      if (finalCatalog.products.some((item) => item.id === product.id)) throw new Error("Produk target masih ditemukan setelah penghapusan.");
      if (finalCatalog.collections.some((collection) => (collection.productIds || []).includes(product.id))) throw new Error("Relasi koleksi target masih ditemukan setelah penghapusan.");
      await validateMediaReferences(finalCatalog);
      await pruneDeleteBackups();
      await cleanupTempMedia();
      return {
        ok: true,
        backupId: backup.id,
        deleted: {
          product: 1,
          collections: backup.manifest.collectionsChanged.length,
          drafts: draftMatches.length,
          tempMedia: tempPaths.length,
          sourceMedia: sourceImagePath ? 1 : 0,
          imagePreserved: Boolean(imageName && !sourceImageExclusive),
          imagePreservedReason: imageName && PROTECTED_PRODUCT_MEDIA.has(imageName)
            ? "protected"
            : imageName && !sourceImageExclusive ? "shared" : "",
        },
      };
    } catch (error) {
      try {
        await restoreBackupInternal(backup.id, { createSafetyBackup: false });
      } catch (recoveryError) {
        throw new AggregateError(
          [error, recoveryError],
          "Penghapusan produk gagal dan rollback otomatis tidak lengkap. Backup dipertahankan di Riwayat backup.",
        );
      }
      throw error;
    }
  });

  const rollback = async (backupId) => runMutation("memulihkan backup", () => restoreBackupInternal(backupId));

  return {
    paths: { dataDir, mediaDir, stateDir, draftsDir, backupsDir, tempDir, transactionsDir },
    ensureDirs,
    readCatalog,
    catalogFingerprint,
    validateCandidate,
    saveDraft,
    listDrafts,
    deleteDraft,
    importTempMedia,
    removeTemp: removeTempIfUnreferenced,
    cleanupTempMedia,
    apply,
    analyzeDelete,
    deleteProduct,
    listBackups,
    rollback,
  };
};
