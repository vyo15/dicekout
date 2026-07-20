import test from "node:test";
import assert from "node:assert/strict";
import products from "../src/data/products.json" with { type: "json" };
import categories from "../src/data/categories.json" with { type: "json" };
import collections from "../src/data/collections.json" with { type: "json" };
import site from "../src/data/site.json" with { type: "json" };
import { validateCatalogData } from "../src/domain/catalog/validateCatalogData.js";

const shopeeShortLink = "https://s.shopee.co.id/9fJO0rHK9y";
const shopeeWrapper = "https://s.shopee.co.id/an_redir?origin_link=https%3A%2F%2Fshopee.co.id%2Fproduct%2F123%2F456&affiliate_id=12345&sub_id=dicekout-test";

const withAffiliateLink = (url) => {
  const copy = structuredClone(products);
  copy[0].affiliateLinks = [{
    marketplace: "shopee",
    url,
    label: "",
    status: "active",
    isPrimary: true,
  }];
  return copy;
};

test("current catalog is valid", () => {
  assert.deepEqual(validateCatalogData({ site, categories, collections, products }).errors, []);
});

test("unknown palette is rejected", () => {
  const copy = structuredClone(products);
  copy[0].visual.paletteId = "unknown";
  assert.ok(validateCatalogData({ site, categories, collections, products: copy }).errors.some((error) => error.includes("paletteId")));
});

test("published non-demo product must pass the publish gate even while the site is still in demo mode", () => {
  const copy = structuredClone(products);
  copy[0].demo = false;
  copy[0].affiliateLinks = [];
  copy[0].notSuitableFor = [];
  const result = validateCatalogData({ site, categories, collections, products: copy });
  assert.ok(result.errors.some((error) => error.includes("affiliate link aktif")));
  assert.ok(result.errors.some((error) => error.includes("notSuitableFor")));
});

test("published CTA claims and mismatched content platforms are rejected with a valid Shopee link", () => {
  const copy = withAffiliateLink(shopeeShortLink);
  copy[0].demo = false;
  copy[0].affiliateLinks[0].label = "Diskon hari ini";
  copy[0].contentReferences = [{
    platform: "instagram",
    label: "Video produk",
    url: "https://youtube.com/watch?v=abc",
    publishedAt: "2026-07-13",
  }];
  const result = validateCatalogData({ site, categories, collections, products: copy });
  assert.ok(result.errors.some((error) => error.includes("klaim promo")));
  assert.ok(result.errors.some((error) => error.includes("tidak cocok dengan platform Instagram")));
  assert.ok(!result.errors.some((error) => error.includes("affiliateLinks[0].url")));
});

test("official Shopee short links and wrappers pass the affiliate format gate", () => {
  for (const url of [shopeeShortLink, shopeeWrapper]) {
    const result = validateCatalogData({ site, categories, collections, products: withAffiliateLink(url) });
    assert.ok(!result.errors.some((error) => error.includes("affiliateLinks[0].url")), url);
  }
});

test("plain product URLs, fake affiliate_id, HTTP, and seller subdomains fail the Shopee gate", () => {
  const invalidUrls = [
    "https://shopee.co.id/product/123/456",
    "https://shopee.co.id/product/123/456?affiliate_id=made-up",
    "http://s.shopee.co.id/9fJO0rHK9y",
    "https://seller.shopee.co.id/portal/product/list/all",
  ];

  for (const url of invalidUrls) {
    const result = validateCatalogData({ site, categories, collections, products: withAffiliateLink(url) });
    assert.ok(result.errors.some((error) => error.includes("affiliateLinks[0].url tidak valid")), url);
  }
});
