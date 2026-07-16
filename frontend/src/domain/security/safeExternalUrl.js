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
