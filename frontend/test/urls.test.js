import test from "node:test";
import assert from "node:assert/strict";
import {
  getSafeContentUrl,
  getSafeExternalUrl,
  parseSafeExternalUrl,
  parseSecureExternalUrl,
  validateAffiliateUrl,
} from "../src/utils/urls.js";
import { getMarketplace, hostnameMatchesMarketplace } from "../src/config/marketplaces.js";

const shopeeWrapper = "https://s.shopee.co.id/an_redir?origin_link=https%3A%2F%2Fshopee.co.id%2Fproduct%2F123%2F456%3Fvariant%3Dblack&affiliate_id=12345&sub_id=dicekout-video-001";
const shopeeAttributedDestination = "https://shopee.co.id/product/123/456?variant=black&uls_trackid=abc123&utm_medium=affiliates&utm_source=an_12345&utm_term=term123&utm_content=dicekout-video-001";

test("Shopee short link keeps the exact original affiliate string", () => {
  const url = "https://s.shopee.co.id/9fJO0rHK9y";
  assert.equal(getSafeExternalUrl(url, "shopee"), url);
  assert.equal(validateAffiliateUrl(url, "shopee").kind, "shopee-short-link");
});

test("official Shopee wrapper and attributed destination formats are recognized without reconstruction", () => {
  assert.equal(getSafeExternalUrl(shopeeWrapper, "shopee"), shopeeWrapper);
  assert.equal(validateAffiliateUrl(shopeeWrapper, "shopee").kind, "shopee-wrapper");
  assert.equal(getSafeExternalUrl(shopeeAttributedDestination, "shopee"), shopeeAttributedDestination);
  assert.equal(validateAffiliateUrl(shopeeAttributedDestination, "shopee").kind, "shopee-attributed-destination");
});

test("unsafe protocols, HTTP affiliate URLs, and embedded credentials are rejected", () => {
  assert.equal(parseSafeExternalUrl("javascript:alert(1)"), null);
  assert.equal(parseSafeExternalUrl("data:text/html,test"), null);
  assert.equal(parseSafeExternalUrl("https://user:pass@example.com/product"), null);
  assert.equal(parseSecureExternalUrl("http://s.shopee.co.id/9fJO0rHK9y"), null);
  assert.equal(getSafeExternalUrl("http://s.shopee.co.id/9fJO0rHK9y", "shopee"), null);
});

test("plain Shopee product URLs and manually added affiliate_id are not treated as affiliate links", () => {
  assert.equal(getSafeExternalUrl("https://shopee.co.id/product/123/456", "shopee"), null);
  assert.equal(getSafeExternalUrl("https://shopee.co.id/product/123/456?affiliate_id=made-up", "shopee"), null);
  assert.match(
    validateAffiliateUrl("https://shopee.co.id/product/123/456", "shopee").message,
    /tidak membuktikan attribution affiliate/i,
  );
});

test("Shopee uses an exact hostname allowlist and rejects seller or lookalike hosts", () => {
  const shopee = getMarketplace("shopee");
  assert.equal(hostnameMatchesMarketplace("s.shopee.co.id", shopee), true);
  assert.equal(hostnameMatchesMarketplace("www.shopee.co.id", shopee), true);
  assert.equal(hostnameMatchesMarketplace("seller.shopee.co.id", shopee), false);
  assert.equal(hostnameMatchesMarketplace("shopee.co.id.example.com", shopee), false);
  assert.equal(getSafeExternalUrl("https://seller.shopee.co.id/portal/product/list/all", "shopee"), null);
  assert.equal(getSafeExternalUrl("https://s.shopee.co.id.example.com/9fJO0rHK9y", "shopee"), null);
});

test("malformed Shopee wrappers and external origin links are rejected", () => {
  const missingAffiliateId = "https://s.shopee.co.id/an_redir?origin_link=https%3A%2F%2Fshopee.co.id%2Fproduct%2F123%2F456";
  const externalOrigin = "https://s.shopee.co.id/an_redir?origin_link=https%3A%2F%2Fexample.com%2Fproduct&affiliate_id=12345";
  assert.equal(getSafeExternalUrl(missingAffiliateId, "shopee"), null);
  assert.equal(getSafeExternalUrl(externalOrigin, "shopee"), null);
});

test("non-Shopee marketplaces remain HTTPS host-validated with an explicit audit warning", () => {
  const url = "https://www.tokopedia.com/example?utm_source=affiliate";
  const validation = validateAffiliateUrl(url, "tokopedia");
  assert.equal(validation.valid, true);
  assert.equal(validation.original, url);
  assert.match(validation.warning, /belum diaudit khusus/i);
});

test("content URL keeps the original post URL only when it matches the selected platform", () => {
  const instagramUrl = "https://www.instagram.com/reel/ABC123/?utm_source=dicekout";
  assert.equal(getSafeContentUrl(instagramUrl, "instagram"), instagramUrl);
  assert.equal(getSafeContentUrl("https://youtube.com/watch?v=123", "instagram"), null);
  assert.equal(getSafeContentUrl("https://facebook.com/watch/123", "fb"), "https://facebook.com/watch/123");
});
