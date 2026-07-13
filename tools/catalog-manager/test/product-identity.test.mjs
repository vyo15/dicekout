import test from "node:test";
import assert from "node:assert/strict";
import { createUniqueProductIdentity, slugifyProductValue } from "../src/productIdentity.js";

test("product identity is generated from the product name", () => {
  assert.deepEqual(createUniqueProductIdentity("Lampu Meja LED"), { id: "prod-lampu-meja-led", slug: "lampu-meja-led" });
});

test("product identity avoids existing ids and slugs", () => {
  const existing = [{ id: "prod-lampu-meja-led", slug: "lampu-meja-led" }];
  assert.deepEqual(createUniqueProductIdentity("Lampu Meja LED", existing), { id: "prod-lampu-meja-led-2", slug: "lampu-meja-led-2" });
});

test("slug generation removes accents and unsafe characters", () => {
  assert.equal(slugifyProductValue("  Café & Meja / Baru  "), "cafe-meja-baru");
});
