import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";

import { getProductReadinessChecks, today } from "../src/catalogManagerUtils.js";

const execFileAsync = promisify(execFile);

const completeProduct = (overrides = {}) => ({
  id: "prod-lampu",
  slug: "lampu",
  name: "Lampu",
  summary: "Ringkas",
  description: "Deskripsi",
  image: "images/products/lampu.webp",
  imageAlt: "Lampu",
  categorySlug: "rumah",
  recommendationReason: "Berguna",
  pros: ["Ringkas"],
  considerations: ["Cek ukuran"],
  suitableFor: ["Meja"],
  notSuitableFor: ["Area luar ruang"],
  status: "published",
  demo: false,
  reviewedAt: "2026-07-20",
  imageSource: "Dokumentasi sendiri",
  imageLicense: "Milik sendiri",
  imageWidth: 1000,
  imageHeight: 1000,
  affiliateDisclosureVariant: "standard",
  affiliateLinks: [{
    marketplace: "shopee",
    url: "https://s.shopee.co.id/9fJO0rHK9y",
    label: "",
    status: "active",
    isPrimary: true,
  }],
  contentReferences: [],
  ...overrides,
});

const catalog = {
  site: { catalogMode: "live" },
  categories: [{ slug: "rumah" }],
  products: [],
};

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

test("publish readiness blocks duplicate identity, invalid affiliate format, and incomplete real products", () => {
  const product = completeProduct({
    notSuitableFor: [],
    reviewedAt: "",
    imageSource: "",
    imageLicense: "",
    imageWidth: 500,
    imageHeight: 500,
    affiliateLinks: [{
      marketplace: "shopee",
      url: "https://shopee.co.id/product/123/456?affiliate_id=made-up",
      label: "Diskon hari ini",
      status: "active",
      isPrimary: true,
    }],
    contentReferences: [{ platform: "instagram", label: "Video", url: "https://youtube.com/watch?v=1" }],
  });
  const checks = new Map(getProductReadinessChecks({
    product,
    catalog: {
      ...catalog,
      products: [{ id: "prod-lain", slug: "lampu" }],
    },
    drafts: [],
  }));

  assert.equal(checks.get("ID dan slug unik"), false);
  assert.equal(checks.get("Kesesuaian pengguna"), false);
  assert.equal(checks.get("URL HTTPS dan format affiliate marketplace"), false);
  assert.equal(checks.get("Link konten sesuai platform"), false);
  assert.equal(checks.get("Tanggal ditinjau"), false);
  assert.equal(checks.get("Sumber dan lisensi gambar"), false);
  assert.equal(checks.get("Resolusi gambar live"), false);
});

test("publish readiness accepts an official Shopee short-link format", () => {
  const checks = getProductReadinessChecks({ product: completeProduct(), catalog, drafts: [] });
  assert.equal(checks.every(([, ready]) => ready), true);
});
