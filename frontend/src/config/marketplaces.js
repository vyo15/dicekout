const MARKETPLACE_DEFINITIONS = [
  {
    id: "shopee",
    label: "Shopee",
    hostnames: ["shopee.co.id", "www.shopee.co.id", "shope.ee", "s.shopee.co.id"],
    allowSubdomains: false,
    affiliateValidation: "shopee-strict",
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
    defaultCta: "Lihat harga di TikTok Shop",
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

const normalizeHostname = (value) => String(value || "").trim().toLowerCase().replace(/\.$/, "");

export const hostnameMatchesMarketplace = (hostname, marketplace) => {
  if (!marketplace || marketplace.id === "other") return true;
  const normalized = normalizeHostname(hostname);
  const allowSubdomains = marketplace.allowSubdomains !== false;

  return marketplace.hostnames.some((allowed) => {
    const allowedNormalized = normalizeHostname(allowed);
    return normalized === allowedNormalized
      || (allowSubdomains && normalized.endsWith(`.${allowedNormalized}`));
  });
};
