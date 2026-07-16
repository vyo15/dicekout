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


test("product identity reserves ids and slugs from source products and local drafts", () => {
  const reserved = [
    { id: "prod-lampu-meja-led", slug: "lampu-meja-led" },
    { id: "prod-lampu-meja-led-2", slug: "lampu-meja-led-2", _draft: { key: "prod-lampu-meja-led-2" } },
  ];
  assert.deepEqual(
    createUniqueProductIdentity("Lampu Meja LED", reserved),
    { id: "prod-lampu-meja-led-3", slug: "lampu-meja-led-3" },
  );
});
