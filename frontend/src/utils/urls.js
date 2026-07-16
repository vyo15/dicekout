import { getMarketplace, hostnameMatchesMarketplace } from "../config/marketplaces.js";
import { parseSafeExternalUrl } from "../domain/security/safeExternalUrl.js";

export { parseSafeExternalUrl } from "../domain/security/safeExternalUrl.js";

export const getSafeExternalUrl = (value, marketplaceId = "other") => {
  const result = parseSafeExternalUrl(value);
  if (!result) return null;

  const marketplace = getMarketplace(marketplaceId);
  if (!marketplace || !hostnameMatchesMarketplace(result.parsed.hostname, marketplace)) return null;

  // Return the exact original string so affiliate query parameters and attribution stay intact.
  return result.original;
};
