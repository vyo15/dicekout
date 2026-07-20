import crypto from "node:crypto";
import {
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { assertSafeBasename, resolveContainedPath } from "./security.mjs";
import {
  PRODUCT_MEDIA_PREFIX,
  TEMP_MAX_AGE_MS,
  TEMP_MAX_FILES,
  exists,
  relativeProductMediaName,
  sha256,
} from "./catalogRepositoryUtils.mjs";

export const createTempMediaRepository = ({
  tempDir,
  ensureDirs,
  listDraftRecords,
}) => {
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

  return {
    removeTempIfUnreferenced,
    cleanupTempMedia,
    importTempMedia,
    verifyTempMedia,
    mediaUsage,
  };
};
