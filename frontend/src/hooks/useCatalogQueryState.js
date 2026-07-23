import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { normalizeCatalogSearchParams } from "../utils/catalogNavigation";

export const useCatalogQueryState = ({ categorySlugs, collectionSlugs }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const normalizedSearch = useMemo(() => normalizeCatalogSearchParams(searchParams, {
    categorySlugs,
    collectionSlugs,
  }), [categorySlugs, collectionSlugs, searchParams]);
  const [query, setQuery] = useState(normalizedSearch.values.query);

  useEffect(() => setQuery(normalizedSearch.values.query), [normalizedSearch.values.query]);

  useEffect(() => {
    if (!normalizedSearch.changed) return;
    setSearchParams(normalizedSearch.params, { replace: true });
  }, [normalizedSearch, setSearchParams]);

  useEffect(() => {
    if (!location.state?.focusCatalogSearch) return undefined;

    const focusFrame = window.requestAnimationFrame(() => {
      const searchInput = searchInputRef.current;
      if (!searchInput) return;

      const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const mobileViewport = window.matchMedia?.("(max-width: 640px)").matches;
      const scrollTarget = mobileViewport
        ? searchInput.closest(".products-catalog-toolbar") || searchInput
        : searchInput;

      scrollTarget.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: mobileViewport ? "start" : "center",
      });
      searchInput.focus({ preventScroll: true });
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    });

    return () => window.cancelAnimationFrame(focusFrame);
  }, [location.pathname, location.search, location.state, navigate]);

  const updateParams = useCallback((updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") next.delete(key);
      else next.set(key, String(value));
    });
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  const resetFilters = useCallback(() => {
    setQuery("");
    setSearchParams({});
  }, [setSearchParams]);

  return {
    values: normalizedSearch.values,
    query,
    setQuery,
    searchInputRef,
    updateParams,
    resetFilters,
  };
};
