import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [e2eSource, eslintSource] = await Promise.all([
  readFile(new URL("../e2e/catalog-journey.spec.js", import.meta.url), "utf8"),
  readFile(new URL("../eslint.config.js", import.meta.url), "utf8"),
]);

test("catalog journey uses unique accessible locators after the UI refactor", () => {
  assert.doesNotMatch(e2eSource, /getByRole\("searchbox"\)/);
  assert.doesNotMatch(e2eSource, /name:\s*\/Kembali ke beranda\/i/);
  assert.doesNotMatch(e2eSource, /getByText\("Marketplace belum tersedia"\)/);
  assert.doesNotMatch(
    e2eSource,
    /page\.getByRole\("button",\s*\{\s*name:\s*"Tutup filter"\s*\}\)/,
  );

  assert.match(
    e2eSource,
    /getByRole\("combobox",\s*\{\s*name:\s*"Cari produk"\s*\}\)/,
  );
  assert.match(
    e2eSource,
    /getByRole\("heading",\s*\{\s*level:\s*2,\s*name:\s*"Marketplace belum tersedia",\s*exact:\s*true\s*\}\)/,
  );
  assert.match(e2eSource, /const filterDialog = page\.getByRole\("dialog",/);
});


test("frontend lint ignores generated Playwright artifacts", () => {
  assert.match(eslintSource, /"playwright-report"/);
  assert.match(eslintSource, /"test-results"/);
  assert.match(eslintSource, /"blob-report"/);
});
