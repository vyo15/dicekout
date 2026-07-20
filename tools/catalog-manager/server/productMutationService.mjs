import path from "node:path";
import { copyFile, rm } from "node:fs/promises";
import { atomicReplaceJsonFiles } from "./atomicWrite.mjs";
import { assertSafeBasename, resolveContainedPath } from "./security.mjs";
import { validateCatalogData } from "../../../frontend/src/shared/catalogDomain.js";
import {
  PRODUCT_MEDIA_PREFIX,
  PROTECTED_PRODUCT_MEDIA,
  clone,
  exists,
  relativeProductMediaName,
} from "./catalogRepositoryUtils.mjs";

export const createProductMutationService = ({
  dataPath,
  mediaDir,
  tempDir,
  runMutation,
  ensureDirs,
  readCatalog,
  catalogFingerprint,
  validateMediaReferences,
  buildCandidate,
  listDraftRecords,
  verifyTempMedia,
  mediaUsage,
  removeTempIfUnreferenced,
  cleanupTempMedia,
  createBackup,
  pruneDeleteBackups,
  restoreBackupInternal,
}) => {
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

  return { apply, analyzeDelete, deleteProduct };
};
