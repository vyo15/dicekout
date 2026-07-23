const SAVED_KEY = "dicekout.saved-products.v1";
const RECENT_KEY = "dicekout.recent-products.v1";
const CHANGE_EVENT = "dicekout:product-preferences";
const FEEDBACK_EVENT = "dicekout:product-preference-feedback";
const MAX_RECENT = 10;

const hasWindow = () => typeof window !== "undefined";

const normalizeIds = (ids) => [...new Set(
  (Array.isArray(ids) ? ids : [])
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean),
)];

const readIds = (key) => {
  if (!hasWindow()) return [];

  try {
    return normalizeIds(JSON.parse(window.localStorage.getItem(key) || "[]"));
  } catch {
    return [];
  }
};

const writeIds = (key, ids) => {
  if (!hasWindow()) return false;
  try {
    const normalized = normalizeIds(ids);
    window.localStorage.setItem(key, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { key } }));
    return true;
  } catch {
    return false;
  }
};

export const getSavedProductIds = () => readIds(SAVED_KEY);
export const getRecentProductIds = () => readIds(RECENT_KEY);

export const isProductSaved = (productId) => getSavedProductIds().includes(productId);

export const replaceSavedProductIds = (ids) => writeIds(SAVED_KEY, ids);

export const toggleSavedProduct = (productId) => {
  const previousIds = getSavedProductIds();
  const nextIds = previousIds.includes(productId)
    ? previousIds.filter((id) => id !== productId)
    : [productId, ...previousIds];
  const success = writeIds(SAVED_KEY, nextIds);

  return {
    success,
    saved: success ? nextIds.includes(productId) : previousIds.includes(productId),
    previousIds,
    nextIds: success ? nextIds : previousIds,
  };
};

export const addRecentlyViewedProduct = (productId) => {
  if (!productId) return false;
  const next = [productId, ...getRecentProductIds().filter((id) => id !== productId)].slice(0, MAX_RECENT);
  return writeIds(RECENT_KEY, next);
};

export const clearSavedProducts = () => {
  const previousIds = getSavedProductIds();
  const success = writeIds(SAVED_KEY, []);
  return { success, previousIds, nextIds: success ? [] : previousIds };
};

export const clearRecentProducts = () => writeIds(RECENT_KEY, []);

export const announceProductPreference = (detail) => {
  if (!hasWindow()) return;
  window.dispatchEvent(new CustomEvent(FEEDBACK_EVENT, { detail }));
};

export const subscribeProductPreferenceFeedback = (listener) => {
  if (!hasWindow()) return () => {};
  window.addEventListener(FEEDBACK_EVENT, listener);
  return () => window.removeEventListener(FEEDBACK_EVENT, listener);
};

export const subscribeProductPreferences = (listener) => {
  if (!hasWindow()) return () => {};
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
};
