import { getMarketplace, verifyAffiliateLinkFormat } from "../config/marketplaces.js";
import { getContentPlatform, hostnameMatchesContentPlatform } from "../config/contentPlatforms.js";
import { parseSafeExternalUrl, parseSafeAffiliateUrl } from "../domain/security/safeExternalUrl.js";

export { parseSafeExternalUrl, parseSafeAffiliateUrl } from "../domain/security/safeExternalUrl.js";

// Full verification result for an affiliate link: { valid, reason }.
// `valid: true` means the URL is HTTPS, safe, and matches the marketplace's
// audited affiliate format -- it never proves account ownership. Use this
// when the UI needs to explain *why* a link was rejected (Catalog Manager);
// use getSafeExternalUrl below when only the pass/fail URL is needed.
export const getAffiliateLinkVerification = (value, marketplaceId = "other") => {
  const marketplace = getMarketplace(marketplaceId);
  if (!marketplace) return { valid: false, reason: "Marketplace tidak dikenali." };

  const result = parseSafeAffiliateUrl(value);
  if (!result) return { valid: false, reason: "URL tidak aman, mengandung kredensial, atau bukan HTTPS." };

  return verifyAffiliateLinkFormat(result.parsed, marketplace);
};

export const getSafeExternalUrl = (value, marketplaceId = "other") => {
  const result = parseSafeAffiliateUrl(value);
  if (!result) return null;

  const marketplace = getMarketplace(marketplaceId);
  if (!marketplace || !verifyAffiliateLinkFormat(result.parsed, marketplace).valid) return null;

  // Return the exact original string so affiliate query parameters and attribution stay intact.
  return result.original;
};

export const getSafeContentUrl = (value, platformId) => {
  const result = parseSafeExternalUrl(value);
  if (!result) return null;

  const platform = getContentPlatform(platformId);
  if (!platform || !hostnameMatchesContentPlatform(result.parsed.hostname, platform)) return null;

  // Preserve the original post URL exactly; only validate protocol, credentials, and host.
  return result.original;
};
