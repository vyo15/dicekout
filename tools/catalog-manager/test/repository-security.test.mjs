import assert from "node:assert/strict";
import crypto from "node:crypto";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createCatalogRepository } from "../server/catalogRepository.mjs";

const writeJson = (file, value) => writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");

const productFixture = () => ({
  id: "prod-security",
  slug: "produk-security",
  name: "Produk Security",
  summary: "Ringkasan produk security.",
  description: "Deskripsi produk security untuk pengujian.",
  image: "images/products/security.webp",
  imageAlt: "Gambar produk security",
  categorySlug: "elektronik",
  collectionSlugs: [],
  recommendationReason: "Alasan rekomendasi security.",
  pros: ["Kelebihan"],
  considerations: ["Pertimbangan"],
  suitableFor: ["Pengguna"],
  notSuitableFor: ["Kebutuhan lain"],
  keywords: ["security"],
  aliases: [],
  featured: false,
  newest: false,
  sortOrder: 1,
  status: "published",
  demo: true,
  updatedAt: "2026-07-15",
  reviewedAt: "2026-07-15",
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
  const root = await mkdtemp(path.join(os.tmpdir(), "dicekout-repository-security-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const dataDir = path.join(root, "frontend", "src", "data");
  const mediaDir = path.join(root, "frontend", "public", "images", "products");
  await Promise.all([mkdir(dataDir, { recursive: true }), mkdir(mediaDir, { recursive: true })]);

  const product = productFixture();
  await Promise.all([
    writeJson(path.join(dataDir, "site.json"), {
      brandName: "DicekOut",
      domain: "dicekout.id",
      title: "DicekOut",
      description: "Katalog pengujian",
      catalogMode: "demo",
      allowIndexing: false,
      contactEmail: "",
      operatorName: "",
      policyEffectiveAt: "2026-07-15",
      policyUpdatedAt: "2026-07-15",
    }),
    writeJson(path.join(dataDir, "categories.json"), [
      { id: "cat-elektronik", slug: "elektronik", name: "Elektronik", description: "Kategori elektronik" },
    ]),
    writeJson(path.join(dataDir, "collections.json"), []),
    writeJson(path.join(dataDir, "products.json"), [product]),
    writeFile(path.join(mediaDir, "security.webp"), "source-image"),
  ]);

  const repo = createCatalogRepository(root);
  await repo.ensureDirs();
  return { root, repo, product, dataDir };
};

test("saveDraft sanitizes malicious id/slug and never writes outside draftsDir", async (t) => {
  const { root, repo, product } = await createFixture(t);
  const outside = path.join(root, "outside-draft.json");
  await writeFile(outside, "DO NOT OVERWRITE", "utf8");

  const key = await repo.saveDraft({
    ...product,
    id: "../../outside-draft",
    slug: "../outside-draft",
    status: "draft",
  }, null);

  assert.equal(key, "outside-draft");
  assert.equal(await readFile(outside, "utf8"), "DO NOT OVERWRITE");
  await access(path.join(repo.paths.draftsDir, "outside-draft.json"));
});

test("apply rejects traversal in tempMedia names before mutating catalog", async (t) => {
  const { root, repo, product, dataDir } = await createFixture(t);
  const before = await readFile(path.join(dataDir, "products.json"), "utf8");
  const outside = path.join(root, "outside-final.webp");
  await writeFile(outside, "DO NOT OVERWRITE", "utf8");

  await assert.rejects(
    repo.apply(product, {
      tempName: "../outside-temp.webp",
      finalName: "../../outside-final.webp",
      hash: "invalid",
      optimized: { width: 1000, height: 1000 },
    }),
    /tidak valid|allowlist/,
  );

  assert.equal(await readFile(path.join(dataDir, "products.json"), "utf8"), before);
  assert.equal(await readFile(outside, "utf8"), "DO NOT OVERWRITE");
});

test("apply rejects traversal in finalName even when tempName is server-generated", async (t) => {
  const { root, repo, product, dataDir } = await createFixture(t);
  const buffer = Buffer.from("optimized-image");
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");
  const media = await repo.importTempMedia({
    buffer,
    finalName: `security-${hash.slice(0, 12)}.webp`,
    metadata: {
      hash,
      path: `images/products/security-${hash.slice(0, 12)}.webp`,
      original: { name: "security.png", format: "PNG", width: 1000, height: 1000, size: 100 },
      optimized: { format: "WebP", width: 1000, height: 1000, size: buffer.length, savedPercent: 80 },
    },
  });
  const before = await readFile(path.join(dataDir, "products.json"), "utf8");
  const outside = path.join(root, "outside-final.webp");
  await writeFile(outside, "DO NOT OVERWRITE", "utf8");

  await assert.rejects(
    repo.apply(product, { ...media, finalName: "../outside-final.webp" }),
    /Nama media final tidak valid/,
  );

  assert.equal(await readFile(path.join(dataDir, "products.json"), "utf8"), before);
  assert.equal(await readFile(outside, "utf8"), "DO NOT OVERWRITE");
});
