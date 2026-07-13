import test from "node:test";
import assert from "node:assert/strict";
import { getSafeExternalUrl, parseSafeExternalUrl } from "../src/utils/urls.js";
import { getMarketplace, hostnameMatchesMarketplace } from "../src/config/marketplaces.js";

test("safe URL keeps the original affiliate attribution string", () => {
  const url = "https://shopee.co.id/product/123?affiliate_id=abc&utm_source=dicekout";
  assert.equal(getSafeExternalUrl(url, "shopee"), url);
});

test("unsafe protocols and embedded credentials are rejected", () => {
  assert.equal(parseSafeExternalUrl("javascript:alert(1)"), null);
  assert.equal(parseSafeExternalUrl("data:text/html,test"), null);
  assert.equal(parseSafeExternalUrl("https://user:pass@example.com/product"), null);
});

test("marketplace hostname must match the registry", () => {
  assert.equal(getSafeExternalUrl("https://example.com/product", "shopee"), null);
  assert.equal(getSafeExternalUrl("https://s.shopee.co.id/abc", "shopee"), "https://s.shopee.co.id/abc");
});

test("subdomains are accepted only for the registered marketplace", () => {
  const shopee = getMarketplace("shopee");
  assert.equal(hostnameMatchesMarketplace("seller.shopee.co.id", shopee), true);
  assert.equal(hostnameMatchesMarketplace("shopee.co.id.example.com", shopee), false);
});
