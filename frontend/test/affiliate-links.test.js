import test from "node:test";
import assert from "node:assert/strict";
import products from "../src/data/products.json" with { type: "json" };
import categories from "../src/data/categories.json" with { type: "json" };
import collections from "../src/data/collections.json" with { type: "json" };
import site from "../src/data/site.json" with { type: "json" };
import {
  getActiveAffiliateLinks,
  getPrimaryAffiliateLink,
} from "../src/utils/catalog.js";
import {
  getAffiliateCtaLabel,
  getMarketplaceCtaPresets,
  hasUnverifiedCtaClaim,
} from "../src/config/marketplaces.js";
import { validateCatalogData } from "../src/domain/catalog/validateCatalogData.js";

test("active affiliate links keep primary first without mutating attribution URLs", () => {
  const secondaryUrl = "https://www.tokopedia.com/example?utm_source=dicekout&sub_id=secondary";
  const primaryUrl = "https://s.shopee.co.id/example?affiliate_id=abc&utm_source=dicekout";
  const inactiveUrl = "https://www.lazada.co.id/example?affiliate_id=inactive";
  const product = {
    affiliateLinks: [
      { marketplace: "tokopedia", url: secondaryUrl, status: "active", isPrimary: false },
      { marketplace: "lazada", url: inactiveUrl, status: "inactive", isPrimary: false },
      { marketplace: "shopee", url: primaryUrl, status: "active", isPrimary: true },
    ],
  };

  const ordered = getActiveAffiliateLinks(product);
  assert.deepEqual(ordered.map((link) => link.marketplace), ["shopee", "tokopedia"]);
  assert.equal(ordered[0].url, primaryUrl);
  assert.equal(ordered[1].url, secondaryUrl);
  assert.equal(product.affiliateLinks[0].marketplace, "tokopedia");
  assert.equal(getPrimaryAffiliateLink(product), product.affiliateLinks[2]);
});

test("affiliate CTA labels adapt to placement while preserving a custom label", () => {
  const link = { marketplace: "shopee", label: "", url: "https://s.shopee.co.id/example" };
  assert.equal(getAffiliateCtaLabel(link, "detail"), "Lihat harga di Shopee");
  assert.equal(getAffiliateCtaLabel(link, "card"), "Lihat di Shopee");
  assert.equal(getAffiliateCtaLabel(link, "sticky"), "Buka di Shopee");
  assert.equal(getAffiliateCtaLabel({ ...link, label: "Buka produk pilihan" }, "detail"), "Buka produk pilihan");
  assert.ok(getMarketplaceCtaPresets("shopee").includes("Lihat harga di Shopee"));
});

test("unverified urgency labels are warned but safe labels are accepted", () => {
  assert.equal(hasUnverifiedCtaClaim("Diskon 90% hari ini"), true);
  assert.equal(hasUnverifiedCtaClaim("Lihat harga di Shopee"), false);

  const candidateProducts = structuredClone(products);
  candidateProducts[0].affiliateLinks = [{
    marketplace: "shopee",
    label: "Stok terbatas, beli sekarang",
    url: "https://s.shopee.co.id/example",
    status: "active",
    isPrimary: true,
  }];

  const result = validateCatalogData({ site, categories, collections, products: candidateProducts });
  assert.ok(result.warnings.some((warning) => warning.includes("klaim promo, harga, atau urgensi")));
});
