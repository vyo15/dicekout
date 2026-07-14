import test from "node:test";
import assert from "node:assert/strict";
import {
  getSearchSuggestions,
  searchProducts,
} from "../src/utils/catalog.js";

test("search matches everyday aliases", () => {
  const result = searchProducts({ query: "stand hp" });
  assert.equal(result[0]?.id, "prod-tripod-hp");
});

test("search can filter by an existing needs collection", () => {
  const result = searchProducts({ collection: "setup-meja-rapi" });
  assert.ok(result.length > 0);
  assert.ok(result.every((product) => product.collectionSlugs.includes("setup-meja-rapi")));
});

test("autocomplete suggests direct products and catalog groups", () => {
  const productSuggestions = getSearchSuggestions("tripod");
  assert.ok(productSuggestions.some((item) => item.to === "/produk/tripod-hp-ringkas"));

  const categorySuggestions = getSearchSuggestions("elektronik");
  assert.ok(categorySuggestions.some((item) => item.to === "/kategori/elektronik"));
});
