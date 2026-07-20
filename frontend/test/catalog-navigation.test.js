import test from "node:test";
import assert from "node:assert/strict";
import {
  getCatalogReturnRoute,
  normalizeCatalogSearchParams,
  sanitizeCatalogReturnRoute,
} from "../src/utils/catalogNavigation.js";

test("catalog return route preserves filters and rejects non-catalog routes", () => {
  assert.equal(getCatalogReturnRoute({ pathname: "/produk", search: "?q=lampu&urut=newest" }), "/produk?q=lampu&urut=newest");
  assert.equal(getCatalogReturnRoute({ pathname: "/kategori/elektronik", search: "" }), "/kategori/elektronik");
  assert.equal(getCatalogReturnRoute({ pathname: "/tentang", search: "" }), "");
});


test("catalog params trim the query and remove invalid guarded filters", () => {
  const result = normalizeCatalogSearchParams(
    new URLSearchParams("q=%20%20lampu%20%20meja%20&kategori=unknown&koleksi=setup&urut=invalid&pilihan=0&terbaru=1"),
    { categorySlugs: ["meja-kerja"], collectionSlugs: ["setup"] },
  );

  assert.equal(result.changed, true);
  assert.deepEqual(result.values, {
    query: "lampu meja",
    category: "all",
    collection: "setup",
    sort: "recommended",
    featured: false,
    newest: true,
  });
  assert.equal(result.params.toString(), "q=lampu+meja&koleksi=setup&terbaru=1");
});

test("catalog return state cannot point outside catalog routes", () => {
  assert.equal(sanitizeCatalogReturnRoute("/produk?q=lampu"), "/produk?q=lampu");
  assert.equal(sanitizeCatalogReturnRoute("https://example.com"), "/produk");
  assert.equal(sanitizeCatalogReturnRoute("/privacy"), "/produk");
  assert.equal(sanitizeCatalogReturnRoute("//example.com"), "/produk");
});
