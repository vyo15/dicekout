import assert from "node:assert/strict";
import crypto from "node:crypto";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createCatalogRepository } from "../server/catalogRepository.mjs";

const writeJson = (file, value) => writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
const product = (overrides = {}) => ({
  id: "prod-target",
  slug: "produk-target",
  name: "Produk Target",
  summary: "Ringkasan produk target.",
  description: "Deskripsi produk target untuk pengujian katalog.",
  image: "images/products/target.webp",
  imageAlt: "Gambar produk target",
  categorySlug: "elektronik",
  collectionSlugs: ["pilihan"],
  recommendationReason: "Alasan rekomendasi yang objektif.",
  pros: ["Kelebihan"],
  considerations: ["Pertimbangan"],
  suitableFor: ["Pengguna"],
  notSuitableFor: ["Kebutuhan lain"],
  keywords: ["target"],
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
  ...overrides,
});

const createFixture = async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "dicekout-delete-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const dataDir = path.join(root, "frontend", "src", "data");
  const mediaDir = path.join(root, "frontend", "public", "images", "products");
  await Promise.all([mkdir(dataDir, { recursive: true }), mkdir(mediaDir, { recursive: true })]);

  const target = product();
  const catalog = {
    site: {
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
    },
    categories: [{ id: "cat-elektronik", slug: "elektronik", name: "Elektronik", description: "Kategori elektronik" }],
    collections: [{ id: "collection-pilihan", slug: "pilihan", name: "Pilihan", description: "Koleksi pilihan", productIds: [target.id], status: "published" }],
    products: [target],
  };
  await Promise.all([
    writeJson(path.join(dataDir, "site.json"), catalog.site),
    writeJson(path.join(dataDir, "categories.json"), catalog.categories),
    writeJson(path.join(dataDir, "collections.json"), catalog.collections),
    writeJson(path.join(dataDir, "products.json"), catalog.products),
    writeFile(path.join(mediaDir, "target.webp"), Buffer.from("source-image")),
  ]);

  const repo = createCatalogRepository(root);
  await repo.ensureDirs();
  const tempBuffer = Buffer.from("temporary-image");
  const hash = crypto.createHash("sha256").update(tempBuffer).digest("hex");
  const tempMedia = await repo.importTempMedia({
    buffer: tempBuffer,
    finalName: `target-${hash.slice(0, 12)}.webp`,
    metadata: {
      hash,
      path: `images/products/target-${hash.slice(0, 12)}.webp`,
      original: { name: "target.png", format: "PNG", width: 1000, height: 1000, size: 100 },
      optimized: { format: "WebP", width: 1000, height: 1000, size: tempBuffer.length, savedPercent: 80 },
    },
  });
  await repo.saveDraft(target, tempMedia);
  return { root, dataDir, mediaDir, repo, target, tempMedia };
};

test("hard delete removes product, all collection relations, matching draft, temp, and exclusive image", async (t) => {
  const fixture = await createFixture(t);
  const impact = await fixture.repo.analyzeDelete(fixture.target.id);

  assert.equal(impact.collections.length, 1);
  assert.equal(impact.drafts.length, 1);
  assert.equal(impact.product.imageShared, false);

  const result = await fixture.repo.deleteProduct({
    productId: fixture.target.id,
    fingerprint: impact.fingerprint,
    confirmationName: fixture.target.name,
    confirmed: true,
  });
  const catalog = await fixture.repo.readCatalog();

  assert.equal(catalog.products.length, 0);
  assert.deepEqual(catalog.collections[0].productIds, []);
  assert.equal((await fixture.repo.listDrafts()).length, 0);
  await assert.rejects(access(path.join(fixture.mediaDir, "target.webp")));
  await assert.rejects(access(path.join(fixture.repo.paths.tempDir, fixture.tempMedia.tempName)));
  assert.deepEqual(result.deleted, {
    product: 1,
    collections: 1,
    drafts: 1,
    tempMedia: 1,
    sourceMedia: 1,
    imagePreserved: false,
    imagePreservedReason: "",
  });

  await fixture.repo.rollback(result.backupId);
  const restored = await fixture.repo.readCatalog();
  assert.equal(restored.products[0].id, fixture.target.id);
  assert.deepEqual(restored.collections[0].productIds, [fixture.target.id]);
  assert.equal((await fixture.repo.listDrafts()).length, 1);
  assert.equal(await readFile(path.join(fixture.mediaDir, "target.webp"), "utf8"), "source-image");
  assert.equal(await readFile(path.join(fixture.repo.paths.tempDir, fixture.tempMedia.tempName), "utf8"), "temporary-image");
});

test("stale fingerprint and wrong confirmation name stop delete before any source mutation", async (t) => {
  const fixture = await createFixture(t);
  const impact = await fixture.repo.analyzeDelete(fixture.target.id);
  const collectionsPath = path.join(fixture.dataDir, "collections.json");
  const collections = JSON.parse(await readFile(collectionsPath, "utf8"));
  collections[0].order = 7;
  await writeJson(collectionsPath, collections);

  await assert.rejects(
    fixture.repo.deleteProduct({
      productId: fixture.target.id,
      fingerprint: impact.fingerprint,
      confirmationName: fixture.target.name,
      confirmed: true,
    }),
    /Katalog berubah/,
  );
  assert.equal((await fixture.repo.readCatalog()).products.length, 1);

  const freshImpact = await fixture.repo.analyzeDelete(fixture.target.id);
  await assert.rejects(
    fixture.repo.deleteProduct({
      productId: fixture.target.id,
      fingerprint: freshImpact.fingerprint,
      confirmationName: "Produk yang salah",
      confirmed: true,
    }),
    /Nama konfirmasi/,
  );
  assert.equal((await fixture.repo.readCatalog()).products.length, 1);
});

test("shared source image is preserved when another product still uses it", async (t) => {
  const fixture = await createFixture(t);
  const productsPath = path.join(fixture.dataDir, "products.json");
  const collectionsPath = path.join(fixture.dataDir, "collections.json");
  const second = product({
    id: "prod-other",
    slug: "produk-lain",
    name: "Produk Lain",
    collectionSlugs: [],
    image: fixture.target.image,
  });
  await writeJson(productsPath, [fixture.target, second]);
  const collections = JSON.parse(await readFile(collectionsPath, "utf8"));
  await writeJson(collectionsPath, collections);

  const impact = await fixture.repo.analyzeDelete(fixture.target.id);
  assert.equal(impact.product.imageShared, true);
  const result = await fixture.repo.deleteProduct({
    productId: fixture.target.id,
    fingerprint: impact.fingerprint,
    confirmationName: fixture.target.name,
    confirmed: true,
  });

  assert.equal(result.deleted.sourceMedia, 0);
  assert.equal(result.deleted.imagePreserved, true);
  assert.equal(result.deleted.imagePreservedReason, "shared");
  assert.equal(await readFile(path.join(fixture.mediaDir, "target.webp"), "utf8"), "source-image");
});


test("protected fallback image is never deleted even when the target is its only user", async (t) => {
  const fixture = await createFixture(t);
  const productsPath = path.join(fixture.dataDir, "products.json");
  const fallbackProduct = product({ image: "images/products/fallback.svg" });
  await writeJson(productsPath, [fallbackProduct]);
  await writeFile(path.join(fixture.mediaDir, "fallback.svg"), "<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>");

  const impact = await fixture.repo.analyzeDelete(fallbackProduct.id);
  assert.equal(impact.product.imageProtected, true);
  assert.equal(impact.product.imageShared, false);
  const result = await fixture.repo.deleteProduct({
    productId: fallbackProduct.id,
    fingerprint: impact.fingerprint,
    confirmationName: fallbackProduct.name,
    confirmed: true,
  });

  assert.equal(result.deleted.sourceMedia, 0);
  assert.equal(result.deleted.imagePreserved, true);
  assert.equal(result.deleted.imagePreservedReason, "protected");
  assert.match(await readFile(path.join(fixture.mediaDir, "fallback.svg"), "utf8"), /<svg/);
});
