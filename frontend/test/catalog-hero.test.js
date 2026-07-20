import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readSource = (relativePath) => fs.readFileSync(path.join(frontendRoot, relativePath), "utf8");

test("catalog hero uses responsive kitchen artwork and a blended catalog shell", () => {
  const productsPage = readSource("src/pages/ProductsPage.jsx");
  const productCard = readSource("src/components/catalog/ProductCard.jsx");
  const catalogHero = readSource("src/components/catalog/CatalogHero.jsx");
  const siteLayout = readSource("src/components/layout/SiteLayout.jsx");
  const siteCss = [
    "base.css",
    "home-foundation.css",
    "catalog-cards.css",
    "catalog-controls.css",
    "product-detail.css",
    "legal.css",
    "layout-responsive.css",
    "home.css",
    "catalog.css",
    "overlays.css",
    "theme-overrides.css",
    "product-enhancements.css",
  ].map((file) => readSource(`src/styles/${file}`)).join("\n");

  assert.match(productsPage, /catalog-kitchen-desktop\.webp/);
  assert.match(productsPage, /catalog-kitchen-mobile\.webp/);
  assert.match(catalogHero, /Cari berdasarkan nama, kebutuhan, atau kategori yang paling relevan\./);
  assert.match(productsPage, /products-catalog-shell/);
  assert.match(productsPage, /Cari produk, kategori, atau kebutuhan\.\.\./);
  assert.match(siteCss, /\.products-catalog-toolbar\s*\{[^}]*backdrop-filter:\s*blur\(22px\)/s);
  assert.match(siteCss, /\.products-catalog-section::before\s*\{[^}]*height:\s*240px/s);
  assert.match(siteCss, /\.page-hero--catalog::after\s*\{[^}]*height:\s*250px/s);
  assert.match(productCard, /badge--featured/);
  assert.doesNotMatch(siteLayout, /DemoNotice/);
  assert.doesNotMatch(siteCss, /\.demo-notice/);
  assert.doesNotMatch(productsPage, /catalog-living-room/);
  assert.match(
    siteCss,
    /\.page-hero:not\(\.page-hero--catalog\)/,
    "light theme must not remove the catalog hero background image",
  );
  assert.doesNotMatch(
    siteCss,
    /html\[data-theme="light"\][^}]*:where\([^)]*\.page-hero,/,
    "generic light-theme cleanup must not target every page hero",
  );

  for (const file of [
    "public/images/hero/catalog-kitchen-desktop.webp",
    "public/images/hero/catalog-kitchen-mobile.webp",
  ]) {
    const assetPath = path.join(frontendRoot, file);
    assert.equal(fs.existsSync(assetPath), true, `${file} harus tersedia`);
    assert.ok(fs.statSync(assetPath).size > 80_000, `${file} tidak boleh terlalu terkompresi`);
  }

  for (const obsoleteFile of [
    "public/images/hero/catalog-living-room-desktop.webp",
    "public/images/hero/catalog-living-room-mobile.webp",
  ]) {
    assert.equal(fs.existsSync(path.join(frontendRoot, obsoleteFile)), false, `${obsoleteFile} harus dibersihkan`);
  }
});
