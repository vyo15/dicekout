import path from "node:path";
import { readdir, rm } from "node:fs/promises";
import { atomicWriteJson } from "./atomicWrite.mjs";
import { assertSafeBasename, resolveContainedPath } from "./security.mjs";
import { normalizeProduct, slugifyProductName } from "../../../frontend/src/shared/catalogDomain.js";
import {
  DRAFT_VERSION,
  PRODUCT_MEDIA_PREFIX,
  exists,
  safeOperationToken,
} from "./catalogRepositoryUtils.mjs";

export const createDraftRepository = ({
  draftsDir,
  ensureDirs,
  readJsonFile,
  runMutation,
  getTempMediaRepository,
}) => {
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

  const saveDraft = async (product, tempMedia) => runMutation("menyimpan draft", async () => {
    const tempRepository = getTempMediaRepository();
    await ensureDirs();
    const verifiedTemp = await tempRepository.verifyTempMedia(tempMedia);
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
      if (tempName !== verifiedTemp?.tempName) await tempRepository.removeTempIfUnreferenced(tempName);
    }
    await tempRepository.cleanupTempMedia();
    return key;
  });

  const deleteDraft = async (draftKey) => runMutation("menghapus draft", async () => {
    const tempRepository = getTempMediaRepository();
    await ensureDirs();
    const key = safeOperationToken(assertSafeBasename(String(draftKey || ""), "ID draft"));
    const file = await resolveContainedPath(draftsDir, `${key}.json`);
    if (!await exists(file)) throw new Error("Draft tidak ditemukan.");
    const record = await parseDraftRecord(`${key}.json`);
    await rm(file, { force: true });
    if (record.tempMedia?.tempName) await tempRepository.removeTempIfUnreferenced(record.tempMedia.tempName);
    return { ok: true, key };
  });

  return {
    parseDraftRecord,
    listDraftRecords,
    listDrafts,
    saveDraft,
    deleteDraft,
  };
};
