import { verifyAffiliateNetworkFormat } from "./affiliateNetworks.js";

const MARKETPLACE_DEFINITIONS = [
  {
    id: "shopee",
    label: "Shopee",
    hostnames: ["shopee.co.id", "shope.ee", "s.shopee.co.id"],
    defaultCta: "Lihat harga di Shopee",
  },
  {
    id: "tokopedia",
    label: "Tokopedia",
    hostnames: ["tokopedia.com", "www.tokopedia.com"],
    defaultCta: "Lihat harga di Tokopedia",
  },
  {
    id: "lazada",
    label: "Lazada",
    hostnames: ["lazada.co.id", "www.lazada.co.id", "s.lazada.co.id"],
    defaultCta: "Lihat harga di Lazada",
  },
  {
    id: "tiktok-shop",
    label: "TikTok Shop",
    hostnames: ["shop.tiktok.com", "vt.tiktok.com"],
    defaultCta: "Lihat konten TikTok",
    affiliateMode: "content-only",
  },
  {
    id: "blibli",
    label: "Blibli",
    hostnames: ["blibli.com", "www.blibli.com"],
    defaultCta: "Lihat harga di Blibli",
  },
  {
    id: "amazon",
    label: "Amazon",
    hostnames: ["amazon.com", "www.amazon.com", "amzn.to"],
    defaultCta: "Lihat harga di Amazon",
  },
  {
    id: "other",
    label: "Marketplace",
    hostnames: [],
    defaultCta: "Lihat harga di marketplace",
  },
];

const RISKY_CTA_LABEL_PATTERN = /\b(?:diskon|termurah|stok\s*(?:terbatas|menipis)|promo\s*(?:hari\s*ini|terbatas)?|beli\s*sekarang|checkout\s*sekarang|buruan|flash\s*sale|gratis\s*ongkir)\b/i;

export const marketplaces = Object.freeze(MARKETPLACE_DEFINITIONS.map((item) => Object.freeze(item)));

export const marketplaceById = new Map(marketplaces.map((item) => [item.id, item]));

export const getMarketplace = (id) => marketplaceById.get(String(id || "").trim()) || null;

export const supportsDirectAffiliateLink = (id) => {
  const marketplace = getMarketplace(id);
  return Boolean(marketplace) && marketplace.affiliateMode !== "content-only";
};

export const getMarketplaceCtaPresets = (id) => {
  const marketplace = getMarketplace(id);
  if (!marketplace) return [];

  const label = marketplace.id === "other" ? "marketplace" : marketplace.label;
  return [...new Set([
    marketplace.defaultCta,
    `Lihat di ${label}`,
    `Buka di ${label}`,
    `Cek produk di ${label}`,
  ])];
};

export const getAffiliateCtaLabel = (link, context = "detail") => {
  const marketplace = getMarketplace(link?.marketplace);
  if (!marketplace) return "";

  const customLabel = String(link?.label || "").trim();
  if (customLabel) return customLabel;

  const label = marketplace.id === "other" ? "marketplace" : marketplace.label;
  if (context === "card" || context === "secondary") return `Lihat di ${label}`;
  if (context === "sticky") return `Buka di ${label}`;
  return marketplace.defaultCta;
};

export const hasUnverifiedCtaClaim = (value) => RISKY_CTA_LABEL_PATTERN.test(String(value || "").trim());

export const hostnameMatchesMarketplace = (hostname, marketplace) => {
  if (!marketplace || marketplace.id === "other") return true;
  const normalized = String(hostname || "").toLowerCase().replace(/^www\./, "");
  return marketplace.hostnames.some((allowed) => {
    const allowedNormalized = allowed.toLowerCase().replace(/^www\./, "");
    return normalized === allowedNormalized || normalized.endsWith(`.${allowedNormalized}`);
  });
};

// --- Affiliate link format policy -------------------------------------
//
// `hostnameMatchesMarketplace` above answers "does this hostname belong to
// this marketplace's domain family" and deliberately accepts subdomains
// (seller.shopee.co.id, help.shopee.co.id, ...). That is fine for general
// display/safety purposes, but it must never be the test used to decide
// whether a URL is *storable as an affiliate link*: a plain product page,
// a seller-portal URL, or a manually appended `?affiliate_id=` string would
// all pass it and look like real affiliate revenue when they are not.
//
// `verifyAffiliateLinkFormat` is the stricter, marketplace-aware check used
// for that decision. Only marketplaces whose official affiliate formats have
// been audited get an exact-host verifier here (Shopee, for now). Every
// other marketplace falls back to the general hostname check above until its
// own documentation is audited (see docs/CATALOG_GUIDE.md, "Scope
// marketplace lain") -- current behavior is preserved for them.

const SHOPEE_SHORT_LINK_HOSTS = new Set(["s.shopee.co.id", "shope.ee"]);
const SHOPEE_CANONICAL_HOSTS = new Set(["shopee.co.id", "www.shopee.co.id"]);
const SHOPEE_AFFILIATE_HOSTS = new Set([...SHOPEE_SHORT_LINK_HOSTS, ...SHOPEE_CANONICAL_HOSTS]);

const verifyShopeeAffiliateFormat = (parsedUrl) => {
  const host = parsedUrl.hostname.toLowerCase();

  if (!SHOPEE_AFFILIATE_HOSTS.has(host)) {
    return {
      valid: false,
      reason: "Host bukan salah satu domain resmi Shopee affiliate (s.shopee.co.id, shope.ee, shopee.co.id, www.shopee.co.id).",
    };
  }

  const path = parsedUrl.pathname;

  // Wrapper format: https://s.shopee.co.id/an_redir?origin_link=...&affiliate_id=...
  if (SHOPEE_SHORT_LINK_HOSTS.has(host) && path === "/an_redir") {
    const originLinkRaw = parsedUrl.searchParams.get("origin_link");
    const affiliateId = parsedUrl.searchParams.get("affiliate_id");
    if (!originLinkRaw) {
      return { valid: false, reason: "Wrapper an_redir wajib memiliki parameter origin_link." };
    }
    if (!affiliateId) {
      return { valid: false, reason: "Wrapper an_redir wajib memiliki parameter affiliate_id." };
    }
    let destination;
    try {
      destination = new URL(originLinkRaw);
    } catch {
      return { valid: false, reason: "origin_link pada wrapper an_redir bukan URL yang valid." };
    }
    if (destination.protocol !== "https:") {
      return { valid: false, reason: "origin_link pada wrapper an_redir harus HTTPS." };
    }
    if (!SHOPEE_CANONICAL_HOSTS.has(destination.hostname.toLowerCase())) {
      return { valid: false, reason: "origin_link pada wrapper an_redir harus menuju shopee.co.id atau www.shopee.co.id, bukan domain lain." };
    }
    return { valid: true, reason: "" };
  }

  // Short link format: https://s.shopee.co.id/<token> or https://shope.ee/<token>.
  // Real Shopee short tokens are a single alphanumeric segment (e.g.
  // "9fJO0rHK9y") -- no hyphens, slashes, or readable words. This is what
  // keeps a human-typed guess like "/not-clearly-affiliate" from being
  // accepted just because it sits on the right host.
  if (SHOPEE_SHORT_LINK_HOSTS.has(host)) {
    const token = path.replace(/^\/+/, "");
    if (!token) {
      return { valid: false, reason: "Short link Shopee wajib memiliki token setelah domain." };
    }
    if (!/^[A-Za-z0-9]+$/.test(token)) {
      return {
        valid: false,
        reason: "Token short link Shopee harus satu segmen alfanumerik tanpa tanda hubung, spasi, atau path tambahan -- URL ini terlihat diketik manual, bukan disalin dari Shopee.",
      };
    }
    return { valid: true, reason: "" };
  }

  // shopee.co.id / www.shopee.co.id without the wrapper structure is a plain
  // product/browse/seller URL. It may be perfectly safe to open, but nothing
  // proves Shopee generated it as an affiliate link -- reject it here even if
  // it carries a manually added `affiliate_id`-looking parameter.
  return {
    valid: false,
    reason: "URL Shopee ini belum terbukti sebagai link affiliate resmi (bukan short link atau wrapper an_redir). Salin link dari Shopee Affiliate, jangan menambahkan affiliate_id secara manual ke URL produk biasa.",
  };
};

const verifyTokopediaDirectFormat = () => ({
  valid: false,
  reason: "URL Tokopedia biasa belum membuktikan atribusi affiliate. Untuk DicekOut, pilih jaringan ACCESSTRADE dan gunakan tracking link hasil Custom Link campaign Tokopedia CPS.",
});

const AFFILIATE_FORMAT_VERIFIERS = {
  shopee: verifyShopeeAffiliateFormat,
  tokopedia: verifyTokopediaDirectFormat,
};

/**
 * Verifies a *parsed, HTTPS-enforced* URL against the marketplace's audited
 * affiliate link format. `parsedUrl` must already have passed
 * `parseSafeAffiliateUrl` (domain/security/safeExternalUrl.js) -- this
 * function only checks host/path/query shape, never protocol or credentials.
 *
 * Returns { valid, reason }. `valid: true` means the format matches a known
 * official pattern and is safe to store/publish -- it never proves account
 * ownership, which can only be confirmed manually via the marketplace's own
 * affiliate dashboard.
 */
export const verifyAffiliateLinkFormat = (parsedUrl, marketplace, networkId = "direct") => {
  if (!marketplace) return { valid: false, reason: "Marketplace tidak dikenali." };
  if (marketplace.affiliateMode === "content-only") {
    return {
      valid: false,
      reason: "TikTok Shop memakai alur content-first. Simpan URL video/posting TikTok pada Konten terkait, bukan sebagai direct affiliate link.",
    };
  }

  const networkVerification = verifyAffiliateNetworkFormat(parsedUrl, networkId);
  if (!networkVerification.valid) return networkVerification;
  if (networkId !== "direct") return { valid: true, reason: "" };
  if (marketplace.id === "other") return { valid: true, reason: "" };

  const verifier = AFFILIATE_FORMAT_VERIFIERS[marketplace.id];
  if (verifier) return verifier(parsedUrl);

  return hostnameMatchesMarketplace(parsedUrl.hostname, marketplace)
    ? { valid: true, reason: "" }
    : { valid: false, reason: `Host tidak cocok dengan domain ${marketplace.label}.` };
};
