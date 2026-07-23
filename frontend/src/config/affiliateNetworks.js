const AFFILIATE_NETWORK_DEFINITIONS = [
  {
    id: "direct",
    label: "Program langsung",
    description: "Link dibuat langsung oleh program affiliate marketplace.",
    hostnames: [],
  },
  {
    id: "accesstrade",
    label: "ACCESSTRADE",
    description: "Tracking link dibuat dari campaign yang sudah disetujui di ACCESSTRADE.",
    hostnames: ["click.accesstrade.co.id", "click.accesstra.de", "cl.accesstrade.co.id", "accesstra.de"],
  },
];

export const affiliateNetworks = Object.freeze(
  AFFILIATE_NETWORK_DEFINITIONS.map((item) => Object.freeze(item)),
);

export const affiliateNetworkById = new Map(affiliateNetworks.map((item) => [item.id, item]));

export const getAffiliateNetwork = (id = "direct") => (
  affiliateNetworkById.get(String(id || "direct").trim()) || null
);

const hostnameMatches = (hostname, allowedHostnames) => {
  const normalized = String(hostname || "").toLowerCase().replace(/^www\./, "");
  return allowedHostnames.some((allowed) => (
    normalized === allowed.toLowerCase().replace(/^www\./, "")
  ));
};

export const verifyAffiliateNetworkFormat = (parsedUrl, networkId = "direct") => {
  const network = getAffiliateNetwork(networkId);
  if (!network) return { valid: false, reason: "Jaringan affiliate tidak dikenali." };
  if (network.id === "direct") return { valid: true, reason: "" };

  if (!hostnameMatches(parsedUrl.hostname, network.hostnames)) {
    return {
      valid: false,
      reason: `URL tidak memakai domain tracking resmi ${network.label}.`,
    };
  }

  const host = parsedUrl.hostname.toLowerCase().replace(/^www\./, "");
  const path = parsedUrl.pathname.replace(/^\/+|\/+$/g, "");
  if (!path) {
    return {
      valid: false,
      reason: `Link ${network.label} belum memiliki token atau path tracking. Salin link hasil generate dari dashboard campaign.`,
    };
  }

  if (host === "click.accesstrade.co.id" || host === "click.accesstra.de") {
    if (/^go\/[A-Za-z0-9_-]+$/.test(path)) return { valid: true, reason: "" };
    if (path === "adv.php" && parsedUrl.searchParams.size > 0) return { valid: true, reason: "" };
    return {
      valid: false,
      reason: "Format tracking ACCESSTRADE tidak dikenali. Gunakan link hasil Get Link/Custom Link, bukan URL yang diketik atau diubah manual.",
    };
  }

  if (host === "cl.accesstrade.co.id" || host === "accesstra.de") {
    if (/^[A-Za-z0-9_-]+$/.test(path)) return { valid: true, reason: "" };
    return {
      valid: false,
      reason: "Token short link ACCESSTRADE harus satu segmen tanpa path tambahan.",
    };
  }

  return {
    valid: false,
    reason: `Format tracking ${network.label} belum didukung. Salin link resmi dari dashboard tanpa memodifikasinya.`,
  };
};
