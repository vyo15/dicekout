import test from "node:test";
import assert from "node:assert/strict";
import products from "../src/data/products.json" with { type: "json" };
import categories from "../src/data/categories.json" with { type: "json" };
import collections from "../src/data/collections.json" with { type: "json" };
import site from "../src/data/site.json" with { type: "json" };
import { validateCatalogData } from "../src/domain/catalog/validateCatalogData.js";

test("current catalog is valid",()=>assert.deepEqual(validateCatalogData({site,categories,collections,products}).errors,[]));
test("unknown palette is rejected",()=>{const copy=structuredClone(products);copy[0].visual.paletteId="unknown";assert.ok(validateCatalogData({site,categories,collections,products:copy}).errors.some(e=>e.includes("paletteId")));});
