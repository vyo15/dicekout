const STORAGE_PREFIX = "dicekout.catalog-scroll:";

const isCatalogPath = (pathname = "") => [
  "/",
  "/produk",
  "/kategori",
  "/koleksi",
  "/tersimpan",
].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

export const getCatalogReturnRoute = (location) => {
  if (!isCatalogPath(location?.pathname)) return "";
  return `${location.pathname}${location.search || ""}`;
};

export const rememberCatalogScroll = (route) => {
  if (typeof window === "undefined" || !route) return;
  window.sessionStorage.setItem(`${STORAGE_PREFIX}${route}`, String(window.scrollY));
};

export const consumeCatalogScroll = (route) => {
  if (typeof window === "undefined" || !route) return null;
  const key = `${STORAGE_PREFIX}${route}`;
  const value = Number(window.sessionStorage.getItem(key));
  window.sessionStorage.removeItem(key);
  return Number.isFinite(value) && value >= 0 ? value : null;
};
