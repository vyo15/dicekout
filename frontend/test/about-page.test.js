import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readSource = (relativePath) => fs.readFileSync(path.join(frontendRoot, relativePath), "utf8");

test("about page reflects DicekOut's curated and user-first positioning", () => {
  const page = readSource("src/pages/AboutPage.jsx");

  assert.match(page, /membantu kamu memilih, bukan memaksa membeli/);
  assert.match(page, /Keputusan akhirnya tetap milikmu/);
  assert.match(page, /Produk terpilih/);
  assert.match(page, /Sudah kami riset/);
  assert.match(page, /Tentukan pilihanmu/);
  assert.match(page, /Tidak ada checkout internal/);
  assert.match(page, /tanpa biaya tambahan untukmu/);
  assert.doesNotMatch(page, /Pusat rekomendasi produk dari konten yang kamu lihat/);
});

test("about page uses a dedicated minimal responsive stylesheet", () => {
  const main = readSource("src/main.jsx");
  const css = readSource("src/styles/about.css");

  assert.match(main, /import "\.\/styles\/about\.css"/);
  assert.match(css, /\.about-hero__layout\s*\{[^}]*grid-template-columns:/s);
  assert.match(css, /\.about-process\s*\{[^}]*repeat\(3, minmax\(0, 1fr\)\)/s);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*?\.about-process\s*\{[^}]*grid-template-columns:\s*1fr/s);
  assert.match(css, /@media \(max-width: 520px\)[\s\S]*?\.about-hero__actions\s*\{[^}]*grid-template-columns:\s*1fr/s);
});
