import assert from "node:assert/strict";
import { access, mkdtemp, rm, utimes, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createCatalogRepository } from "../server/catalogRepository.mjs";

const draftProduct = (id, name) => ({
  id,
  slug: id.replace(/^prod-/, ""),
  name,
  summary: "Draft test",
  description: "Draft test description",
  image: "images/products/shared.webp",
  imageAlt: "Draft image",
  categorySlug: "test",
  collectionSlugs: [],
  recommendationReason: "Draft reason",
  pros: [],
  considerations: [],
  suitableFor: [],
  notSuitableFor: [],
  keywords: [],
  aliases: [],
  featured: false,
  newest: false,
  sortOrder: 999,
  status: "draft",
  demo: true,
  updatedAt: "2026-07-14",
  reviewedAt: "",
  imageSource: "",
  imageLicense: "",
  imageWidth: 800,
  imageHeight: 800,
  affiliateLinks: [],
  contentReferences: [],
  visual: { paletteId: "neutral", imageFit: "contain", imageScale: "medium", imagePosition: "center" },
});

const createRepo = async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "dicekout-media-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const repo = createCatalogRepository(root);
  await repo.ensureDirs();
  return repo;
};

const importTemp = (repo, label) => repo.importTempMedia({
  buffer: Buffer.from(label),
  finalName: `${label}.webp`,
  metadata: {
    hash: "",
    path: `images/products/${label}.webp`,
    original: { name: `${label}.png`, format: "PNG", width: 800, height: 800, size: label.length },
    optimized: { format: "WebP", width: 800, height: 800, size: label.length, savedPercent: 0 },
  },
});

test("temporary media shared by two drafts is removed only after the last draft is deleted", async (t) => {
  const repo = await createRepo(t);
  const media = await importTemp(repo, "shared-temp");
  await repo.saveDraft(draftProduct("prod-one", "Draft One"), media);
  await repo.saveDraft(draftProduct("prod-two", "Draft Two"), media);

  await repo.deleteDraft("prod-one");
  await access(path.join(repo.paths.tempDir, media.tempName));

  await repo.deleteDraft("prod-two");
  await assert.rejects(access(path.join(repo.paths.tempDir, media.tempName)));
});

test("saving a replacement image for the same draft cleans the previous unreferenced temp immediately", async (t) => {
  const repo = await createRepo(t);
  const first = await importTemp(repo, "first-temp");
  const second = await importTemp(repo, "second-temp");
  const item = draftProduct("prod-replace", "Draft Replace");

  await repo.saveDraft(item, first);
  await repo.saveDraft(item, second);

  await assert.rejects(access(path.join(repo.paths.tempDir, first.tempName)));
  await access(path.join(repo.paths.tempDir, second.tempName));
  const drafts = await repo.listDrafts();
  assert.equal(drafts.length, 1);
  assert.equal(drafts[0]._draft.tempMedia.tempName, second.tempName);
});

test("startup cleanup removes old orphan temp but preserves an old temp referenced by a draft", async (t) => {
  const repo = await createRepo(t);
  const referenced = await importTemp(repo, "referenced-temp");
  await repo.saveDraft(draftProduct("prod-referenced", "Referenced Draft"), referenced);
  const orphan = path.join(repo.paths.tempDir, "old-orphan.webp");
  await writeFile(orphan, "orphan");
  const old = new Date(Date.now() - 48 * 60 * 60 * 1000);
  await Promise.all([
    utimes(path.join(repo.paths.tempDir, referenced.tempName), old, old),
    utimes(orphan, old, old),
  ]);

  await repo.cleanupTempMedia();

  await access(path.join(repo.paths.tempDir, referenced.tempName));
  await assert.rejects(access(orphan));
});
