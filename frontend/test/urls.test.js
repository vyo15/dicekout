import test from "node:test";
import assert from "node:assert/strict";
import {
  getAffiliateLinkVerification,
  getSafeContentUrl,
  getSafeExternalUrl,
  parseSafeAffiliateUrl,
  parseSafeExternalUrl,
} from "../src/utils/urls.js";
import { getMarketplace, hostnameMatchesMarketplace } from "../src/config/marketplaces.js";

test("safe URL keeps the original affiliate attribution string", () => {
  const url = "https://s.shopee.co.id/an_redir?origin_link=https%3A%2F%2Fshopee.co.id%2Fproduct%2F123%2F456&affiliate_id=dicekout&sub_id=homepage";
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

test("general hostname registry still accepts marketplace subdomains (used for display/safety, NOT for deciding affiliate eligibility)", () => {
  const shopee = getMarketplace("shopee");
  assert.equal(hostnameMatchesMarketplace("seller.shopee.co.id", shopee), true);
  assert.equal(hostnameMatchesMarketplace("shopee.co.id.example.com", shopee), false);
});

test("HTTP is rejected for affiliate links even on an official Shopee host", () => {
  assert.equal(parseSafeAffiliateUrl("http://s.shopee.co.id/9fJO0rHK9y"), null);
  assert.equal(getSafeExternalUrl("http://s.shopee.co.id/9fJO0rHK9y", "shopee"), null);
});

test("Shopee affiliate format accepts only official short links and an_redir wrappers", () => {
  const mustAccept = [
    "https://s.shopee.co.id/9fJO0rHK9y",
    "https://shope.ee/1L9EQKhA93",
    "https://s.shopee.co.id/an_redir?origin_link=https%3A%2F%2Fshopee.co.id%2Fproduct%2F1%2F2&affiliate_id=abc",
  ];
  for (const url of mustAccept) {
    assert.equal(getAffiliateLinkVerification(url, "shopee").valid, true, `expected ${url} to be accepted`);
  }

  const mustReject = [
    "https://shopee.co.id/product/123/456",
    "https://shopee.co.id/nama-produk-i.123.456",
    "https://shopee.co.id/product/123/456?affiliate_id=made-up",
    "https://seller.shopee.co.id/portal/product/list/all",
    "https://help.shopee.co.id/faq",
    "https://s.shopee.co.id/not-clearly-affiliate",
    "http://s.shopee.co.id/9fJO0rHK9y",
    "https://s.shopee.co.id.evil.example/token",
    "https://s.shopee.co.id/an_redir?affiliate_id=abc",
    "https://s.shopee.co.id/an_redir?origin_link=https%3A%2F%2Ftokopedia.com%2Fproduct&affiliate_id=abc",
    "https://dicekout.id/go/produk",
    "https://bit.ly/contoh-shopee",
  ];
  for (const url of mustReject) {
    assert.equal(getAffiliateLinkVerification(url, "shopee").valid, false, `expected ${url} to be rejected`);
  }
});

test("Shopee affiliate URL is never rewritten when it passes validation", () => {
  const shortLink = "https://s.shopee.co.id/9fJO0rHK9y";
  assert.equal(getSafeExternalUrl(shortLink, "shopee"), shortLink);

  const wrapper = "https://shope.ee/an_redir?origin_link=https%3A%2F%2Fwww.shopee.co.id%2Fproduct%2F1%2F2&affiliate_id=dicekout&sub_id=blog-review";
  assert.equal(getSafeExternalUrl(wrapper, "shopee"), wrapper);
});

test("content URL keeps the original post URL only when it matches the selected platform", () => {
  const instagramUrl = "https://www.instagram.com/reel/ABC123/?utm_source=dicekout";
  assert.equal(getSafeContentUrl(instagramUrl, "instagram"), instagramUrl);
  assert.equal(getSafeContentUrl("https://youtube.com/watch?v=123", "instagram"), null);
  assert.equal(getSafeContentUrl("https://facebook.com/watch/123", "fb"), "https://facebook.com/watch/123");
});


test("Tokopedia through ACCESSTRADE accepts generated tracking shapes and preserves the original URL", () => {
  const generatedLinks = [
    "https://click.accesstrade.co.id/go/AbC_123-xYz",
    "https://click.accesstra.de/go/mdIbibVo",
    "https://click.accesstrade.co.id/adv.php?rk=abc123&url=https%3A%2F%2Fwww.tokopedia.com%2Fproduk",
    "https://cl.accesstrade.co.id/AbC_123-xYz",
    "https://accesstra.de/AbC_123-xYz",
  ];

  for (const url of generatedLinks) {
    assert.equal(getAffiliateLinkVerification(url, "tokopedia", "accesstrade").valid, true, `expected ${url} to be accepted`);
    assert.equal(getSafeExternalUrl(url, "tokopedia", "accesstrade"), url);
  }
});

test("Tokopedia direct links, fake ACCESSTRADE hosts, and hand-written tracking paths are rejected", () => {
  const rejected = [
    ["https://www.tokopedia.com/toko/produk", "tokopedia", "direct"],
    ["https://click.accesstrade.co.id.example.com/go/abc", "tokopedia", "accesstrade"],
    ["https://sub.click.accesstrade.co.id/go/abc", "tokopedia", "accesstrade"],
    ["https://click.accesstrade.co.id/manual/path/product", "tokopedia", "accesstrade"],
    ["https://cl.accesstrade.co.id/token/path", "tokopedia", "accesstrade"],
  ];

  for (const [url, marketplace, network] of rejected) {
    assert.equal(getAffiliateLinkVerification(url, marketplace, network).valid, false, `expected ${url} to be rejected`);
  }
});

test("TikTok Shop cannot be stored as a direct affiliate destination", () => {
  const url = "https://shop.tiktok.com/view/product/123";
  const result = getAffiliateLinkVerification(url, "tiktok-shop", "direct");
  assert.equal(result.valid, false);
  assert.match(result.reason, /content-first/);
  assert.equal(getSafeExternalUrl(url, "tiktok-shop", "direct"), null);
});
