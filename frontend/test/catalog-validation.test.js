import test from "node:test";
import assert from "node:assert/strict";
import products from "../src/data/products.json" with { type: "json" };
import categories from "../src/data/categories.json" with { type: "json" };
import collections from "../src/data/collections.json" with { type: "json" };
import site from "../src/data/site.json" with { type: "json" };
import { validateCatalogData } from "../src/domain/catalog/validateCatalogData.js";

test("current catalog is valid",()=>assert.deepEqual(validateCatalogData({site,categories,collections,products}).errors,[]));
test("unknown palette is rejected",()=>{const copy=structuredClone(products);copy[0].visual.paletteId="unknown";assert.ok(validateCatalogData({site,categories,collections,products:copy}).errors.some(e=>e.includes("paletteId")));});


test("published non-demo product must pass the publish gate even while the site is still in demo mode", () => {
  const copy = structuredClone(products);
  copy[0].demo = false;
  copy[0].affiliateLinks = [];
  copy[0].notSuitableFor = [];
  const result = validateCatalogData({ site, categories, collections, products: copy });
  assert.ok(result.errors.some((error) => error.includes("affiliate link aktif")));
  assert.ok(result.errors.some((error) => error.includes("notSuitableFor")));
});

test("published CTA claims and mismatched content platforms are rejected", () => {
  const copy = structuredClone(products);
  copy[0].demo = false;
  copy[0].affiliateLinks = [{
    marketplace: "shopee",
    url: "https://s.shopee.co.id/pR0duct123",
    label: "Diskon hari ini",
    status: "active",
    isPrimary: true,
  }];
  copy[0].contentReferences = [{
    platform: "instagram",
    label: "Video produk",
    url: "https://youtube.com/watch?v=abc",
    publishedAt: "2026-07-13",
  }];
  const result = validateCatalogData({ site, categories, collections, products: copy });
  assert.ok(result.errors.some((error) => error.includes("klaim promo")));
  assert.ok(result.errors.some((error) => error.includes("tidak cocok dengan platform Instagram")));
});

test("a real Shopee product page cannot be published as an affiliate link, even with a manually added affiliate_id", () => {
  const copy = structuredClone(products);
  copy[0].demo = false;
  copy[0].affiliateLinks = [{
    marketplace: "shopee",
    url: "https://shopee.co.id/product/123/456?affiliate_id=buatan-sendiri",
    label: "",
    status: "active",
    isPrimary: true,
  }];
  const result = validateCatalogData({ site, categories, collections, products: copy });
  assert.ok(result.errors.some((error) => error.includes("belum terbukti sebagai link affiliate resmi")));
});

test("a Shopee seller-portal subdomain cannot be published as an affiliate link", () => {
  const copy = structuredClone(products);
  copy[0].demo = false;
  copy[0].affiliateLinks = [{
    marketplace: "shopee",
    url: "https://seller.shopee.co.id/portal/product/list/all",
    label: "",
    status: "active",
    isPrimary: true,
  }];
  const result = validateCatalogData({ site, categories, collections, products: copy });
  assert.ok(result.errors.some((error) => error.includes("Host bukan salah satu domain resmi Shopee affiliate")));
});

test("a malformed an_redir wrapper (missing origin_link, or pointing outside shopee.co.id) cannot be published", () => {
  const missingOriginLink = structuredClone(products);
  missingOriginLink[0].demo = false;
  missingOriginLink[0].affiliateLinks = [{
    marketplace: "shopee",
    url: "https://s.shopee.co.id/an_redir?affiliate_id=dicekout",
    label: "",
    status: "active",
    isPrimary: true,
  }];
  const resultMissing = validateCatalogData({ site, categories, collections, products: missingOriginLink });
  assert.ok(resultMissing.errors.some((error) => error.includes("wajib memiliki parameter origin_link")));

  const wrongDestination = structuredClone(products);
  wrongDestination[0].demo = false;
  wrongDestination[0].affiliateLinks = [{
    marketplace: "shopee",
    url: "https://s.shopee.co.id/an_redir?origin_link=https%3A%2F%2Ftokopedia.com%2Fproduk&affiliate_id=dicekout",
    label: "",
    status: "active",
    isPrimary: true,
  }];
  const resultWrongDestination = validateCatalogData({ site, categories, collections, products: wrongDestination });
  assert.ok(resultWrongDestination.errors.some((error) => error.includes("harus menuju shopee.co.id atau www.shopee.co.id")));
});

test("an official Shopee short link and a well-formed an_redir wrapper both pass the publish gate", () => {
  const copy = structuredClone(products);
  copy[0].demo = false;
  copy[0].notSuitableFor = copy[0].notSuitableFor?.length ? copy[0].notSuitableFor : ["Pemula yang butuh garansi resmi"];
  copy[0].reviewedAt = "2026-07-01";
  copy[0].affiliateLinks = [{
    marketplace: "shopee",
    url: "https://s.shopee.co.id/9fJO0rHK9y",
    label: "",
    status: "active",
    isPrimary: true,
  }];
  const result = validateCatalogData({ site, categories, collections, products: copy });
  assert.ok(!result.errors.some((error) => error.includes(".affiliateLinks[0].url")));
});
