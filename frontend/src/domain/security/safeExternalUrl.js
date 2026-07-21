const SAFE_PROTOCOLS = new Set(["http:", "https:"]);
const AFFILIATE_PROTOCOLS = new Set(["https:"]);

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

// Stricter variant for production affiliate links. Affiliate URLs must be
// HTTPS-only (see docs/CATALOG_GUIDE.md, "Protokol"); general external links
// such as content references keep using parseSafeExternalUrl above, which
// still allows HTTP.
export const parseSafeAffiliateUrl = (value) => {
  const result = parseSafeExternalUrl(value);
  if (!result) return null;
  if (!AFFILIATE_PROTOCOLS.has(result.parsed.protocol)) return null;
  return result;
};
