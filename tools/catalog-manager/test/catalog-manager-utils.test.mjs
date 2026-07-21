import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";

import { getProductReadinessChecks, today } from "../src/catalogManagerUtils.js";

const execFileAsync = promisify(execFile);

test("today formats a local calendar date and rejects invalid input", () => {
  assert.equal(today(new Date(2026, 6, 16, 0, 30)), "2026-07-16");
  assert.equal(today(new Date("invalid")), "");
});

test("today does not move Jakarta dates back to the previous UTC day", async () => {
  const moduleUrl = new URL("../src/catalogManagerUtils.js", import.meta.url).href;
  const script = `import { today } from ${JSON.stringify(moduleUrl)}; process.stdout.write(today(new Date("2026-07-15T17:30:00.000Z")));`;
  const { stdout } = await execFileAsync(process.execPath, ["--input-type=module", "-e", script], {
    env: { ...process.env, TZ: "Asia/Jakarta" },
  });
  assert.equal(stdout, "2026-07-16");
});


test("publish readiness blocks duplicate identity, unsafe links, and incomplete real products", () => {
  const product = {
    id: "prod-lampu", slug: "lampu", name: "Lampu", summary: "Ringkas", description: "Deskripsi",
    image: "images/products/lampu.webp", imageAlt: "Lampu", categorySlug: "rumah",
    recommendationReason: "Berguna", pros: ["Ringkas"], considerations: ["Cek ukuran"],
    suitableFor: ["Meja"], notSuitableFor: [], status: "published", demo: false, reviewedAt: "",
    imageSource: "", imageLicense: "", imageWidth: 500, imageHeight: 500,
    affiliateDisclosureVariant: "standard",
    affiliateLinks: [{ marketplace: "shopee", url: "https://example.com", label: "Diskon hari ini", status: "active", isPrimary: true }],
    contentReferences: [{ platform: "instagram", label: "Video", url: "https://youtube.com/watch?v=1" }],
  };
  const checks = new Map(getProductReadinessChecks({
    product,
    catalog: {
      site: { catalogMode: "live" },
      categories: [{ slug: "rumah" }],
      products: [{ id: "prod-lain", slug: "lampu" }],
    },
    drafts: [],
  }));

  assert.equal(checks.get("ID dan slug unik"), false);
  assert.equal(checks.get("Kesesuaian pengguna"), false);
  assert.equal(checks.get("Format affiliate link valid tanpa klaim palsu"), false);
  assert.equal(checks.get("Link konten sesuai platform"), false);
  assert.equal(checks.get("Tanggal ditinjau"), false);
  assert.equal(checks.get("Sumber dan lisensi gambar"), false);
  assert.equal(checks.get("Resolusi gambar live"), false);
});

test("readiness rejects a plain Shopee product URL even with a clean label, and accepts an official short link", () => {
  const baseProduct = {
    id: "prod-lampu", slug: "lampu", name: "Lampu", summary: "Ringkas", description: "Deskripsi",
    image: "images/products/lampu.webp", imageAlt: "Lampu", categorySlug: "rumah",
    recommendationReason: "Berguna", pros: ["Ringkas"], considerations: ["Cek ukuran"],
    suitableFor: ["Meja"], notSuitableFor: ["Ruangan sempit"], status: "draft", demo: false, reviewedAt: "2026-07-01",
    imageSource: "Dokumentasi sendiri", imageLicense: "Milik sendiri", imageWidth: 800, imageHeight: 800,
    affiliateDisclosureVariant: "standard",
    contentReferences: [],
  };
  const catalog = {
    site: { catalogMode: "demo" },
    categories: [{ slug: "rumah" }],
    products: [],
  };

  const plainUrlProduct = {
    ...baseProduct,
    affiliateLinks: [{ marketplace: "shopee", url: "https://shopee.co.id/product/123/456", label: "Lihat harga di Shopee", status: "active", isPrimary: true }],
  };
  const plainUrlChecks = new Map(getProductReadinessChecks({ product: plainUrlProduct, catalog, drafts: [] }));
  assert.equal(plainUrlChecks.get("Format affiliate link valid tanpa klaim palsu"), false);

  const shortLinkProduct = {
    ...baseProduct,
    affiliateLinks: [{ marketplace: "shopee", url: "https://s.shopee.co.id/9fJO0rHK9y", label: "Lihat harga di Shopee", status: "active", isPrimary: true }],
  };
  const shortLinkChecks = new Map(getProductReadinessChecks({ product: shortLinkProduct, catalog, drafts: [] }));
  assert.equal(shortLinkChecks.get("Format affiliate link valid tanpa klaim palsu"), true);
});
