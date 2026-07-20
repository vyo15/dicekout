import crypto from "node:crypto";
import path from "node:path";
import {
  copyFile,
  mkdir,
  readdir,
  rm,
  stat,
} from "node:fs/promises";
import { atomicReplaceJsonFiles, atomicWriteJson } from "./atomicWrite.mjs";
import { assertSafeBasename, resolveContainedPath } from "./security.mjs";
import { validateCatalogData } from "../../../frontend/src/shared/catalogDomain.js";
import {
  BACKUP_VERSION,
  DELETE_BACKUP_RETENTION,
  MIN_SUPPORTED_BACKUP_VERSION,
  exists,
  relativeProductMediaName,
  safeOperationToken,
  timestamp,
} from "./catalogRepositoryUtils.mjs";

export const createBackupRepository = ({
  backupsDir,
  mediaDir,
  draftsDir,
  tempDir,
  ensureDirs,
  readCatalog,
  readJsonFile,
  dataPath,
  catalogFingerprint,
  validateMediaReferences,
  cleanupTempMedia,
}) => {
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

  const pruneDeleteBackups = async () => {
    const backups = await listBackups();
    const deleteBackups = backups.filter((backup) => backup.operation === "delete-product");
    for (const backup of deleteBackups.slice(DELETE_BACKUP_RETENTION)) {
      const dir = await resolveContainedPath(backupsDir, backup.id);
      await rm(dir, { recursive: true, force: true });
    }
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
      if (finalValidation.errors.length) throw new Error(`Rollback menghasilkan katalog tidak valid:\n${finalValidation.errors.join("\n")}`);
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

  return {
    createBackup,
    listBackups,
    pruneDeleteBackups,
    restoreBackupInternal,
  };
};
