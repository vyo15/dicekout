import { useMemo, useState } from "react";

export const useCatalogListState = ({ catalog, drafts }) => {
  const [query, setQuery] = useState("");
  const [view, setView] = useState("products");
  const [listMode, setListMode] = useState("source");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredProducts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const source = listMode === "draft" ? drafts : (catalog?.products || []);
    return source.filter((item) => {
      const matchesKeyword = !keyword || `${item.name} ${item.slug} ${item.status} ${item.categorySlug}`.toLowerCase().includes(keyword);
      const matchesStatus = listMode === "draft" || statusFilter === "all" || item.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || item.categorySlug === categoryFilter;
      return matchesKeyword && matchesStatus && matchesCategory;
    });
  }, [catalog, drafts, query, listMode, statusFilter, categoryFilter]);

  return {
    query,
    setQuery,
    view,
    setView,
    listMode,
    setListMode,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    filteredProducts,
  };
};
