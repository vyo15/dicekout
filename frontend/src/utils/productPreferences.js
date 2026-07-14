const SAVED_KEY = "dicekout.saved-products.v1";
const RECENT_KEY = "dicekout.recent-products.v1";
const CHANGE_EVENT = "dicekout:product-preferences";
const MAX_RECENT = 10;

const hasWindow = () => typeof window !== "undefined";

const readIds = (key) => {
  if (!hasWindow()) return [];

  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "[]");
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter((item) => typeof item === "string" && item.trim()))];
  } catch {
    return [];
  }
};

const writeIds = (key, ids) => {
  if (!hasWindow()) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { key } }));
    return true;
  } catch {
    return false;
  }
};

export const getSavedProductIds = () => readIds(SAVED_KEY);
export const getRecentProductIds = () => readIds(RECENT_KEY);

export const isProductSaved = (productId) => getSavedProductIds().includes(productId);

export const toggleSavedProduct = (productId) => {
  const current = getSavedProductIds();
  const next = current.includes(productId)
    ? current.filter((id) => id !== productId)
    : [productId, ...current];
  writeIds(SAVED_KEY, next);
  return next.includes(productId);
};

export const addRecentlyViewedProduct = (productId) => {
  if (!productId) return;
  const next = [productId, ...getRecentProductIds().filter((id) => id !== productId)].slice(0, MAX_RECENT);
  writeIds(RECENT_KEY, next);
};

export const clearSavedProducts = () => writeIds(SAVED_KEY, []);
export const clearRecentProducts = () => writeIds(RECENT_KEY, []);

export const subscribeProductPreferences = (listener) => {
  if (!hasWindow()) return () => {};
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
};
