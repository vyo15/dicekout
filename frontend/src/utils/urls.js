export const getSafeExternalUrl = (value) => {
  const original = String(value || "").trim();
  if (!original) return null;

  try {
    const parsed = new URL(original);
    if (!new Set(["http:", "https:"]).has(parsed.protocol)) return null;
    if (parsed.username || parsed.password) return null;
    return original;
  } catch {
    return null;
  }
};
