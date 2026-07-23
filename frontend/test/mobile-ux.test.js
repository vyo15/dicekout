import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readSource = (relativePath) => fs.readFileSync(path.join(frontendRoot, relativePath), "utf8");

test("homepage mobile uses one gutter and three balanced benefit columns", () => {
  const homeCss = readSource("src/styles/home.css");
  const overlaysCss = readSource("src/styles/overlays.css");

  assert.match(homeCss, /Mobile homepage alignment:[\s\S]*?\.hero-search\.container\s*\{[^}]*calc\(100% - 32px\)/s);
  assert.match(homeCss, /Mobile homepage alignment:[\s\S]*?\.hero-benefits\s*\{[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/s);
  assert.match(homeCss, /Mobile homepage alignment:[\s\S]*?\.hero-categories__heading\s*\{[^}]*calc\(100% - 32px\)/s);
  assert.match(homeCss, /Mobile homepage alignment:[\s\S]*?\.hero-category-scroll\s*\{[^}]*calc\(100% - 32px\)/s);
  assert.match(homeCss, /Mobile homepage alignment:[\s\S]*?\.hero-category-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/s);
  assert.doesNotMatch(overlaysCss, /Homepage mobile discovery rails/);
});

test("personal collection navigation is distinct from editorial themes", () => {
  const bottomNav = readSource("src/components/layout/MobileBottomNavigation.jsx");
  const header = readSource("src/components/layout/SiteHeader.jsx");
  const moreMenu = readSource("src/components/layout/MobileMoreMenu.jsx");
  const collectionPage = readSource("src/pages/CollectionPage.jsx");

  assert.match(bottomNav, /to="\/tersimpan"/);
  assert.match(bottomNav, /mobile-bottom-nav__badge/);
  assert.match(bottomNav, />Koleksi</);
  assert.match(header, /to: "\/koleksi", label: "Tema"/);
  assert.match(moreMenu, /Koleksi kamu/);
  assert.match(moreMenu, /Tema rekomendasi/);
  assert.match(moreMenu, /FiLayers/);
  assert.match(collectionPage, /label: "Tema", to: "\/koleksi"/);
  assert.doesNotMatch(collectionPage, /label: "Koleksi", to: "\/produk"/);
});

test("saved collection has compact tools, local storage notice, feedback, and undo", () => {
  const savedPage = readSource("src/pages/SavedProductsPage.jsx");
  const saveButton = readSource("src/components/catalog/SaveProductButton.jsx");
  const toast = readSource("src/components/feedback/PreferenceToast.jsx");
  const preferences = readSource("src/utils/productPreferences.js");

  assert.match(savedPage, /<h1>Koleksi kamu<\/h1>/);
  assert.match(savedPage, /savedProducts\.length >= 5/);
  assert.match(savedPage, /savedCategories\.length > 1/);
  assert.match(savedPage, /if \(!showSearch && query\) setQuery\(""\)/);
  assert.match(savedPage, /if \(!showCategoryFilters \|\| !selectedCategoryStillExists\) setSelectedCategory\("all"\)/);
  assert.match(savedPage, /Koleksi disimpan di browser dan perangkat ini/);
  assert.match(savedPage, /Belum ada produk di Koleksi/);
  assert.match(saveButton, /undoIds: result\.previousIds/);
  assert.match(toast, />Urungkan</);
  assert.match(toast, /aria-live=/);
  assert.match(preferences, /localStorage\.setItem/);
  assert.match(preferences, /return false/);
});

test("footer is minimal and remains above the fixed mobile navigation", () => {
  const footer = readSource("src/components/layout/SiteFooter.jsx");
  const responsiveCss = readSource("src/styles/layout-responsive.css");
  const overlaysCss = readSource("src/styles/overlays.css");

  assert.match(footer, /to="\/tentang"/);
  assert.match(footer, /to="\/privacy"/);
  assert.match(footer, /to="\/disclosure"/);
  assert.match(footer, /tanpa biaya tambahan untukmu/);
  assert.doesNotMatch(footer, /to="\/produk"/);
  assert.doesNotMatch(footer, /to="\/kategori"/);
  assert.doesNotMatch(footer, /to="\/koleksi"/);
  assert.match(responsiveCss, /\.site-footer__top\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1\.25fr\)/s);
  assert.match(overlaysCss, /padding-bottom:\s*calc\(var\(--mobile-bottom-nav-height\) \+ 24px \+ env\(safe-area-inset-bottom\)\)/);
});
