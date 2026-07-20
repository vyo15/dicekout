import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  BACKUP_VERSION,
  DRAFT_VERSION,
  MIN_SUPPORTED_BACKUP_VERSION,
} from "../server/catalogRepositoryUtils.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const collectSourceFiles = async (directory) => {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectSourceFiles(target));
    else if (/\.(?:js|jsx|mjs)$/.test(entry.name)) files.push(target);
  }
  return files;
};

test("catalog repository keeps version compatibility while using focused modules", async () => {
  assert.equal(DRAFT_VERSION, 1);
  assert.equal(BACKUP_VERSION, 2);
  assert.equal(MIN_SUPPORTED_BACKUP_VERSION, 1);

  const facade = await readFile(path.join(root, "server", "catalogRepository.mjs"), "utf8");
  for (const moduleName of [
    "catalogStore",
    "draftRepository",
    "tempMediaRepository",
    "backupRepository",
    "productMutationService",
  ]) {
    assert.match(facade, new RegExp(moduleName));
  }
  for (const publicMethod of [
    "readCatalog",
    "catalogFingerprint",
    "validateCandidate",
    "saveDraft",
    "listDrafts",
    "deleteDraft",
    "importTempMedia",
    "cleanupTempMedia",
    "apply",
    "analyzeDelete",
    "deleteProduct",
    "listBackups",
    "rollback",
  ]) {
    assert.match(facade, new RegExp(`${publicMethod}:|\\b${publicMethod},`));
  }
});

test("manager uses shared frontend entry points and split styles", async () => {
  await assert.rejects(access(path.join(root, "src", "styles.css")));
  const sourceFiles = await collectSourceFiles(path.join(root, "src"));
  const serverFiles = await collectSourceFiles(path.join(root, "server"));
  for (const file of [...sourceFiles, ...serverFiles]) {
    const source = await readFile(file, "utf8");
    const unsafeImports = source.match(/frontend\/src\/(?!shared\/)[^"']+/g) || [];
    assert.deepEqual(unsafeImports, [], `${path.relative(root, file)} memakai deep import frontend.`);
  }

  const main = await readFile(path.join(root, "src", "main.jsx"), "utf8");
  for (const file of ["base.css", "catalog.css", "layout.css", "theme.css", "workflow.css"]) {
    assert.match(main, new RegExp(`styles/${file.replace(".", "\\.")}`));
  }
});
