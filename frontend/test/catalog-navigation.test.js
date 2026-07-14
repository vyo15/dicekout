import test from "node:test";
import assert from "node:assert/strict";
import { getCatalogReturnRoute } from "../src/utils/catalogNavigation.js";

test("catalog return route preserves filters and rejects non-catalog routes", () => {
  assert.equal(getCatalogReturnRoute({ pathname: "/produk", search: "?q=lampu&urut=newest" }), "/produk?q=lampu&urut=newest");
  assert.equal(getCatalogReturnRoute({ pathname: "/kategori/elektronik", search: "" }), "/kategori/elektronik");
  assert.equal(getCatalogReturnRoute({ pathname: "/tentang", search: "" }), "");
});
