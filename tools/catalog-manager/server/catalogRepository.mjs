import path from "node:path";
import { mkdir } from "node:fs/promises";
import { createBackupRepository } from "./backupRepository.mjs";
import { createCatalogStore } from "./catalogStore.mjs";
import { createDraftRepository } from "./draftRepository.mjs";
import { createProductMutationService } from "./productMutationService.mjs";
import { createTempMediaRepository } from "./tempMediaRepository.mjs";

export const createCatalogRepository = (projectRoot) => {
  const dataDir = path.join(projectRoot, "frontend", "src", "data");
  const mediaDir = path.join(projectRoot, "frontend", "public", "images", "products");
  const stateDir = path.join(projectRoot, ".catalog-manager");
  const draftsDir = path.join(stateDir, "drafts");
  const backupsDir = path.join(stateDir, "backups");
  const tempDir = path.join(stateDir, "temp");
  const transactionsDir = path.join(stateDir, "transactions");
  let activeMutation = null;

  const ensureDirs = async () => {
    await Promise.all([stateDir, draftsDir, backupsDir, tempDir, transactionsDir, mediaDir].map((dir) => mkdir(dir, { recursive: true })));
  };

  const runMutation = async (name, operation) => {
    if (activeMutation) throw new Error(`Operasi ${activeMutation} sedang berjalan. Tunggu sampai selesai.`);
    activeMutation = name;
    try {
      return await operation();
    } finally {
      activeMutation = null;
    }
  };

  const catalogStore = createCatalogStore({ dataDir, mediaDir });

  let tempMediaRepository = null;
  const draftRepository = createDraftRepository({
    draftsDir,
    ensureDirs,
    readJsonFile: catalogStore.readJsonFile,
    runMutation,
    getTempMediaRepository: () => tempMediaRepository,
  });
  tempMediaRepository = createTempMediaRepository({
    tempDir,
    ensureDirs,
    listDraftRecords: draftRepository.listDraftRecords,
  });

  const backupRepository = createBackupRepository({
    backupsDir,
    mediaDir,
    draftsDir,
    tempDir,
    ensureDirs,
    readCatalog: catalogStore.readCatalog,
    readJsonFile: catalogStore.readJsonFile,
    dataPath: catalogStore.dataPath,
    catalogFingerprint: catalogStore.catalogFingerprint,
    validateMediaReferences: catalogStore.validateMediaReferences,
    cleanupTempMedia: tempMediaRepository.cleanupTempMedia,
  });

  const productMutationService = createProductMutationService({
    dataPath: catalogStore.dataPath,
    mediaDir,
    tempDir,
    runMutation,
    ensureDirs,
    readCatalog: catalogStore.readCatalog,
    catalogFingerprint: catalogStore.catalogFingerprint,
    validateMediaReferences: catalogStore.validateMediaReferences,
    buildCandidate: catalogStore.buildCandidate,
    listDraftRecords: draftRepository.listDraftRecords,
    verifyTempMedia: tempMediaRepository.verifyTempMedia,
    mediaUsage: tempMediaRepository.mediaUsage,
    removeTempIfUnreferenced: tempMediaRepository.removeTempIfUnreferenced,
    cleanupTempMedia: tempMediaRepository.cleanupTempMedia,
    createBackup: backupRepository.createBackup,
    pruneDeleteBackups: backupRepository.pruneDeleteBackups,
    restoreBackupInternal: backupRepository.restoreBackupInternal,
  });

  const rollback = async (backupId) => runMutation(
    "memulihkan backup",
    () => backupRepository.restoreBackupInternal(backupId),
  );

  return {
    paths: { dataDir, mediaDir, stateDir, draftsDir, backupsDir, tempDir, transactionsDir },
    ensureDirs,
    readCatalog: catalogStore.readCatalog,
    catalogFingerprint: catalogStore.catalogFingerprint,
    validateCandidate: catalogStore.validateCandidate,
    saveDraft: draftRepository.saveDraft,
    listDrafts: draftRepository.listDrafts,
    deleteDraft: draftRepository.deleteDraft,
    importTempMedia: tempMediaRepository.importTempMedia,
    removeTemp: tempMediaRepository.removeTempIfUnreferenced,
    cleanupTempMedia: tempMediaRepository.cleanupTempMedia,
    apply: productMutationService.apply,
    analyzeDelete: productMutationService.analyzeDelete,
    deleteProduct: productMutationService.deleteProduct,
    listBackups: backupRepository.listBackups,
    rollback,
  };
};
