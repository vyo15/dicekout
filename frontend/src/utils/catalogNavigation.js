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

const CATALOG_SORT_VALUES = new Set(["recommended", "newest", "name-asc"]);
const MAX_CATALOG_QUERY_LENGTH = 120;

export const normalizeCatalogSearchParams = (
  searchParams,
  { categorySlugs = [], collectionSlugs = [] } = {},
) => {
  const next = new URLSearchParams(searchParams);
  const allowedCategories = new Set(categorySlugs);
  const allowedCollections = new Set(collectionSlugs);
  let changed = false;

  const rawQuery = next.get("q") || "";
  const normalizedQuery = rawQuery.replace(/\s+/g, " ").trim().slice(0, MAX_CATALOG_QUERY_LENGTH);
  if (normalizedQuery) {
    if (normalizedQuery !== rawQuery) {
      next.set("q", normalizedQuery);
      changed = true;
    }
  } else if (next.has("q")) {
    next.delete("q");
    changed = true;
  }

  const normalizeSelection = (key, allowed) => {
    const value = next.get(key);
    if (!value) return "all";
    if (allowed.has(value)) return value;
    next.delete(key);
    changed = true;
    return "all";
  };

  const category = normalizeSelection("kategori", allowedCategories);
  const collection = normalizeSelection("koleksi", allowedCollections);

  const rawSort = next.get("urut") || "recommended";
  const sort = CATALOG_SORT_VALUES.has(rawSort) ? rawSort : "recommended";
  if (sort === "recommended") {
    if (next.has("urut")) {
      next.delete("urut");
      changed = true;
    }
  } else if (sort !== rawSort) {
    next.set("urut", sort);
    changed = true;
  }

  const normalizeFlag = (key) => {
    const value = next.get(key);
    if (value === "1") return true;
    if (value !== null) {
      next.delete(key);
      changed = true;
    }
    return false;
  };

  const featured = normalizeFlag("pilihan");
  const newest = normalizeFlag("terbaru");

  return {
    params: next,
    changed,
    values: {
      query: normalizedQuery,
      category,
      collection,
      sort,
      featured,
      newest,
    },
  };
};

export const sanitizeCatalogReturnRoute = (value, fallback = "/produk") => {
  const route = String(value || "");
  if (!route.startsWith("/") || route.startsWith("//")) return fallback;
  const [pathname] = route.split(/[?#]/, 1);
  return isCatalogPath(pathname) ? route : fallback;
};
