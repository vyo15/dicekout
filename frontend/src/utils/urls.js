import { getMarketplace, hostnameMatchesMarketplace } from "../config/marketplaces.js";

const SAFE_PROTOCOLS = new Set(["http:", "https:"]);

export const parseSafeExternalUrl = (value) => {
  const original = String(value || "").trim();
  if (!original) return null;

  try {
    const parsed = new URL(original);
    if (!SAFE_PROTOCOLS.has(parsed.protocol)) return null;
    if (parsed.username || parsed.password) return null;
    return { original, parsed };
  } catch {
    return null;
  }
};

export const getSafeExternalUrl = (value, marketplaceId = "other") => {
  const result = parseSafeExternalUrl(value);
  if (!result) return null;

  const marketplace = getMarketplace(marketplaceId);
  if (!marketplace || !hostnameMatchesMarketplace(result.parsed.hostname, marketplace)) return null;

  // Return the exact original string so affiliate query parameters and attribution stay intact.
  return result.original;
};
