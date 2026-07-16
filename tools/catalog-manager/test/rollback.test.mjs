import assert from "node:assert/strict";
import crypto from "node:crypto";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createCatalogRepository } from "../server/catalogRepository.mjs";

const writeJson = (file, value) => writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
const makeProduct = () => ({
  id: "prod-rollback",
  slug: "produk-rollback",
  name: "Produk Rollback",
  summary: "Ringkasan produk rollback.",
  description: "Deskripsi produk rollback untuk pengujian.",
  image: "images/products/old.webp",
  imageAlt: "Gambar produk rollback",
  categorySlug: "elektronik",
  collectionSlugs: ["pilihan"],
  recommendationReason: "Alasan rekomendasi rollback.",
  pros: ["Kelebihan"],
  considerations: ["Pertimbangan"],
  suitableFor: ["Pengguna"],
  notSuitableFor: ["Kebutuhan lain"],
  keywords: ["rollback"],
  aliases: [],
  featured: false,
  newest: false,
  sortOrder: 1,
  status: "published",
  demo: true,
  updatedAt: "2026-07-14",
  reviewedAt: "2026-07-14",
  imageSource: "internal test",
  imageLicense: "internal-demo",
  imageWidth: 1000,
  imageHeight: 1000,
  marketplaceProductId: "",
  affiliateDisclosureVariant: "standard",
  affiliateLinks: [],
  contentReferences: [],
  visual: { paletteId: "neutral", imageFit: "contain", imageScale: "medium", imagePosition: "center" },
});

const createFixture = async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "dicekout-rollback-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const dataDir = path.join(root, "frontend", "src", "data");
  const mediaDir = path.join(root, "frontend", "public", "images", "products");
  await Promise.all([mkdir(dataDir, { recursive: true }), mkdir(mediaDir, { recursive: true })]);
  const product = makeProduct();
  const site = {
    brandName: "DicekOut",
    domain: "dicekout.id",
    title: "DicekOut",
    description: "Katalog pengujian",
    catalogMode: "demo",
    allowIndexing: false,
    contactEmail: "",
    operatorName: "",
    policyEffectiveAt: "2026-07-14",
    policyUpdatedAt: "2026-07-14",
  };
  const categories = [{ id: "cat-elektronik", slug: "elektronik", name: "Elektronik", description: "Kategori elektronik" }];
  const collections = [{ id: "collection-pilihan", slug: "pilihan", name: "Pilihan", description: "Koleksi pilihan", productIds: [product.id], status: "published" }];
  await Promise.all([
    writeJson(path.join(dataDir, "site.json"), site),
    writeJson(path.join(dataDir, "categories.json"), categories),
    writeJson(path.join(dataDir, "collections.json"), collections),
    writeJson(path.join(dataDir, "products.json"), [product]),
    writeFile(path.join(mediaDir, "old.webp"), "old-image"),
  ]);
  const repo = createCatalogRepository(root);
  await repo.ensureDirs();
  return { repo, product, mediaDir };
};

test("apply rollback restores old JSON, media, draft, and temp; safety rollback can return to the applied state", async (t) => {
  const { repo, product, mediaDir } = await createFixture(t);
  const newBuffer = Buffer.from("new-optimized-image");
  const hash = crypto.createHash("sha256").update(newBuffer).digest("hex");
  const finalName = `produk-rollback-${hash.slice(0, 12)}.webp`;
  const tempMedia = await repo.importTempMedia({
    buffer: newBuffer,
    finalName,
    metadata: {
      hash,
      path: `images/products/${finalName}`,
      original: { name: "new.png", format: "PNG", width: 1200, height: 1200, size: 4000 },
      optimized: { format: "WebP", width: 1000, height: 1000, size: newBuffer.length, savedPercent: 90 },
    },
  });
  const updated = { ...product, image: tempMedia.path, imageWidth: 1000, imageHeight: 1000, summary: "Ringkasan setelah apply." };
  await repo.saveDraft(updated, tempMedia);

  const applied = await repo.apply(updated, tempMedia);
  assert.equal(applied.errors.length, 0);
  assert.equal((await repo.readCatalog()).products[0].summary, "Ringkasan setelah apply.");
  assert.equal(await readFile(path.join(mediaDir, finalName), "utf8"), "new-optimized-image");
  await assert.rejects(access(path.join(mediaDir, "old.webp")));
  assert.equal((await repo.listDrafts()).length, 0);
  await assert.rejects(access(path.join(repo.paths.tempDir, tempMedia.tempName)));

  await repo.rollback(applied.backupId);
  const restored = await repo.readCatalog();
  assert.equal(restored.products[0].summary, product.summary);
  assert.equal(restored.products[0].image, product.image);
  assert.equal(await readFile(path.join(mediaDir, "old.webp"), "utf8"), "old-image");
  await assert.rejects(access(path.join(mediaDir, finalName)));
  assert.equal((await repo.listDrafts()).length, 1);
  assert.equal(await readFile(path.join(repo.paths.tempDir, tempMedia.tempName), "utf8"), "new-optimized-image");

  const safety = (await repo.listBackups()).find((backup) => backup.operation === "pre-rollback" && backup.rollbackTarget === applied.backupId);
  assert.ok(safety, "pre-rollback safety backup should exist");
  await repo.rollback(safety.id);
  const reapplied = await repo.readCatalog();
  assert.equal(reapplied.products[0].summary, "Ringkasan setelah apply.");
  assert.equal(reapplied.products[0].image, `images/products/${finalName}`);
  assert.equal(await readFile(path.join(mediaDir, finalName), "utf8"), "new-optimized-image");
  await assert.rejects(access(path.join(mediaDir, "old.webp")));
  assert.equal((await repo.listDrafts()).length, 0);
  await assert.rejects(access(path.join(repo.paths.tempDir, tempMedia.tempName)));
});

test("backup preflight marks incomplete and unsupported backups as non-restorable", async (t) => {
  const { repo } = await createFixture(t);
  const catalog = await repo.readCatalog();

  const incompleteId = "2026-07-16T00-00-00-incomplete";
  const incompleteDir = path.join(repo.paths.backupsDir, incompleteId);
  await mkdir(incompleteDir, { recursive: true });
  await writeJson(path.join(incompleteDir, "manifest.json"), {
    version: 2,
    id: incompleteId,
    operation: "apply-product",
    createdAt: "2026-07-16T00:00:00.000Z",
    mediaBackedUp: [],
    draftsBackedUp: [],
    tempBackedUp: [],
  });

  const unsupportedId = "2026-07-16T00-00-01-unsupported";
  const unsupportedDir = path.join(repo.paths.backupsDir, unsupportedId);
  await mkdir(unsupportedDir, { recursive: true });
  await Promise.all([
    writeJson(path.join(unsupportedDir, "products.json"), catalog.products),
    writeJson(path.join(unsupportedDir, "collections.json"), catalog.collections),
    writeJson(path.join(unsupportedDir, "manifest.json"), {
      version: 999,
      id: unsupportedId,
      operation: "apply-product",
      createdAt: "2026-07-16T00:00:01.000Z",
      mediaBackedUp: [],
      draftsBackedUp: [],
      tempBackedUp: [],
    }),
  ]);

  const missingMediaId = "2026-07-16T00-00-02-missing-media";
  const missingMediaDir = path.join(repo.paths.backupsDir, missingMediaId);
  await mkdir(missingMediaDir, { recursive: true });
  await Promise.all([
    writeJson(path.join(missingMediaDir, "products.json"), catalog.products),
    writeJson(path.join(missingMediaDir, "collections.json"), catalog.collections),
    writeJson(path.join(missingMediaDir, "manifest.json"), {
      version: 2,
      id: missingMediaId,
      operation: "apply-product",
      createdAt: "2026-07-16T00:00:02.000Z",
      mediaBackedUp: ["missing.webp"],
      draftsBackedUp: [],
      tempBackedUp: [],
    }),
  ]);

  const backups = await repo.listBackups();
  const incomplete = backups.find((backup) => backup.id === incompleteId);
  const unsupported = backups.find((backup) => backup.id === unsupportedId);
  const missingMedia = backups.find((backup) => backup.id === missingMediaId);

  assert.equal(incomplete.restorable, false);
  assert.match(incomplete.issue, /products\.json|collections\.json/);
  assert.equal(unsupported.restorable, false);
  assert.match(unsupported.issue, /Versi backup/);
  assert.equal(missingMedia.restorable, false);
  assert.match(missingMedia.issue, /tidak lengkap/);

  await assert.rejects(repo.rollback(incompleteId), /tidak dapat dipulihkan/);
  await assert.rejects(repo.rollback(unsupportedId), /tidak dapat dipulihkan/);
  assert.equal((await repo.readCatalog()).products[0].id, catalog.products[0].id);
});
