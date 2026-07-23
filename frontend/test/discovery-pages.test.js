import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readSource = (relativePath) => fs.readFileSync(path.join(frontendRoot, relativePath), "utf8");

test("category and theme directory pages use the shared clean discovery layout", () => {
  const categoriesPage = readSource("src/pages/CategoriesPage.jsx");
  const collectionsPage = readSource("src/pages/CollectionsPage.jsx");

  assert.match(categoriesPage, /discovery-hero discovery-hero--categories/);
  assert.match(categoriesPage, /category-grid category-grid--directory/);
  assert.match(categoriesPage, /Temukan produk dari kategori yang kamu butuhkan/);

  assert.match(collectionsPage, /discovery-hero discovery-hero--themes/);
  assert.match(collectionsPage, /collection-grid collection-grid--directory/);
  assert.match(collectionsPage, /Inspirasi produk dalam tema yang lebih mudah dipahami/);
});

test("directory cards expose useful context without changing compact homepage cards", () => {
  const categoryCard = readSource("src/components/catalog/CategoryCard.jsx");
  const collectionCard = readSource("src/components/catalog/CollectionCard.jsx");

  assert.match(categoryCard, /category-card--\$\{isCompact \? "compact" : "directory"\}/);
  assert.match(categoryCard, /category\.description/);
  assert.match(collectionCard, /collection-card collection-card--directory/);
  assert.match(collectionCard, /collection-card__count/);
  assert.match(collectionCard, /Lihat tema/);
});

test("category and theme detail pages use compact summaries and correct back navigation", () => {
  const categoryPage = readSource("src/pages/CategoryPage.jsx");
  const collectionPage = readSource("src/pages/CollectionPage.jsx");

  assert.match(categoryPage, /discovery-detail-hero discovery-detail-hero--\$\{category\.accent\}/);
  assert.match(categoryPage, /to="\/kategori"/);
  assert.match(categoryPage, /Kategori lainnya/);

  assert.match(collectionPage, /discovery-detail-hero discovery-detail-hero--theme/);
  assert.match(collectionPage, /to="\/koleksi"/);
  assert.match(collectionPage, /Tema lainnya/);
});

test("discovery stylesheet keeps responsive directory layouts minimal", () => {
  const main = readSource("src/main.jsx");
  const css = readSource("src/styles/discovery.css");

  assert.match(main, /import "\.\/styles\/discovery\.css"/);
  assert.match(css, /\.category-grid--directory\s*\{[^}]*repeat\(2, minmax\(0, 1fr\)\)/s);
  assert.match(css, /\.collection-grid--directory\s*\{[^}]*repeat\(3, minmax\(0, 1fr\)\)/s);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*?\.category-grid--directory,[\s\S]*?grid-template-columns:\s*1fr/s);
  assert.match(css, /@media \(max-width: 520px\)[\s\S]*?\.discovery-hero \.breadcrumbs,[\s\S]*?display:\s*none/s);
});
