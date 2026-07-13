const MARKETPLACE_DEFINITIONS = [
  {
    id: "shopee",
    label: "Shopee",
    hostnames: ["shopee.co.id", "shope.ee", "s.shopee.co.id"],
    defaultCta: "Cek di Shopee",
  },
  {
    id: "tokopedia",
    label: "Tokopedia",
    hostnames: ["tokopedia.com", "www.tokopedia.com"],
    defaultCta: "Cek di Tokopedia",
  },
  {
    id: "lazada",
    label: "Lazada",
    hostnames: ["lazada.co.id", "www.lazada.co.id", "s.lazada.co.id"],
    defaultCta: "Cek di Lazada",
  },
  {
    id: "tiktok-shop",
    label: "TikTok Shop",
    hostnames: ["shop.tiktok.com", "vt.tiktok.com"],
    defaultCta: "Cek di TikTok Shop",
  },
  {
    id: "blibli",
    label: "Blibli",
    hostnames: ["blibli.com", "www.blibli.com"],
    defaultCta: "Cek di Blibli",
  },
  {
    id: "amazon",
    label: "Amazon",
    hostnames: ["amazon.com", "www.amazon.com", "amzn.to"],
    defaultCta: "Cek di Amazon",
  },
  {
    id: "other",
    label: "Marketplace",
    hostnames: [],
    defaultCta: "Cek di marketplace",
  },
];

export const marketplaces = Object.freeze(MARKETPLACE_DEFINITIONS.map((item) => Object.freeze(item)));

export const marketplaceById = new Map(marketplaces.map((item) => [item.id, item]));

export const getMarketplace = (id) => marketplaceById.get(String(id || "").trim()) || null;

export const hostnameMatchesMarketplace = (hostname, marketplace) => {
  if (!marketplace || marketplace.id === "other") return true;
  const normalized = String(hostname || "").toLowerCase().replace(/^www\./, "");
  return marketplace.hostnames.some((allowed) => {
    const allowedNormalized = allowed.toLowerCase().replace(/^www\./, "");
    return normalized === allowedNormalized || normalized.endsWith(`.${allowedNormalized}`);
  });
};
