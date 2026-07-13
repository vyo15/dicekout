import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiFilter, FiRefreshCw, FiSearch, FiX } from "react-icons/fi";
import Seo from "../components/common/Seo";
import Breadcrumbs from "../components/common/Breadcrumbs";
import CatalogFilters from "../components/catalog/CatalogFilters";
import CatalogFilterDrawer from "../components/catalog/CatalogFilterDrawer";
import ProductGrid from "../components/catalog/ProductGrid";
import EmptyState from "../components/feedback/EmptyState";
import { categories, products, searchProducts } from "../utils/catalog";

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  const categoryParam = searchParams.get("kategori") || "all";
  const sortParam = searchParams.get("urut") || "recommended";
  const featuredParam = searchParams.get("pilihan") === "1";
  const newestParam = searchParams.get("terbaru") === "1";
  const [query, setQuery] = useState(queryParam);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => setQuery(queryParam), [queryParam]);

  const result = useMemo(() => searchProducts({
    query: queryParam,
    category: categoryParam,
    sort: sortParam,
    featured: featuredParam,
    newest: newestParam,
  }), [categoryParam, featuredParam, newestParam, queryParam, sortParam]);

  const categoryCounts = useMemo(() => products.reduce((counts, product) => {
    counts.all += 1;
    counts[product.categorySlug] = (counts[product.categorySlug] || 0) + 1;
    return counts;
  }, { all: 0 }), []);

  const updateParams = useCallback((updates) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") next.delete(key);
      else next.set(key, String(value));
    });

    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  const handleSearch = (event) => {
    event.preventDefault();
    updateParams({ q: query.trim() || null });
  };

  const resetFilters = useCallback(() => {
    setQuery("");
    setSearchParams({});
  }, [setSearchParams]);

  const closeFilterDrawer = useCallback(() => setFilterOpen(false), []);

  const selectedCategory = categories.find((category) => category.slug === categoryParam) || null;
  const featuredCount = products.filter((product) => product.featured).length;
  const newestCount = products.filter((product) => product.newest).length;
  const hasActiveFilters = Boolean(
    queryParam
    || categoryParam !== "all"
    || featuredParam
    || newestParam
    || sortParam !== "recommended",
  );

  const activeFilters = [
    queryParam ? { key: "q", label: `Pencarian: ${queryParam}` } : null,
    selectedCategory ? { key: "kategori", label: selectedCategory.name } : null,
    featuredParam ? { key: "pilihan", label: "Pilihan DicekOut" } : null,
    newestParam ? { key: "terbaru", label: "Terbaru dibahas" } : null,
  ].filter(Boolean);

  const removeActiveFilter = (key) => {
    if (key === "q") setQuery("");
    updateParams({ [key]: null });
  };

  const filterProps = {
    categories,
    categoryCounts,
    selectedCategory: categoryParam,
    featuredOnly: featuredParam,
    newestOnly: newestParam,
    featuredCount,
    newestCount,
    onCategoryChange: (value) => updateParams({ kategori: value === "all" ? null : value }),
    onFeaturedChange: (checked) => updateParams({ pilihan: checked ? "1" : null }),
    onNewestChange: (checked) => updateParams({ terbaru: checked ? "1" : null }),
    onReset: resetFilters,
  };

  const title = queryParam
    ? `Hasil pencarian “${queryParam}” | DicekOut`
    : "Semua Produk Rekomendasi | DicekOut";

  return (
    <>
      <Seo
        title={title}
        description="Jelajahi seluruh produk rekomendasi DicekOut berdasarkan nama, kategori, dan koleksi konten."
        path={queryParam ? `produk?q=${encodeURIComponent(queryParam)}` : "produk"}
      />

      <section className="page-hero page-hero--compact page-hero--catalog">
        <div className="container">
          <Breadcrumbs items={[{ label: "Beranda", to: "/" }, { label: "Semua Produk" }]} />
          <div className="page-hero__catalog-row">
            <div>
              <span className="eyebrow">Katalog DicekOut</span>
              <h1>Temukan produk yang sedang kamu cari.</h1>
              <p>Cari berdasarkan nama, kata dari video, atau pilih kategori yang paling relevan.</p>
            </div>
            <div className="page-hero__catalog-stats" aria-label="Ringkasan katalog">
              <div>
                <strong>{products.length}</strong>
                <span>Produk</span>
              </div>
              <div>
                <strong>{categories.length}</strong>
                <span>Kategori</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="products-catalog-section section--surface" id="catalog-products">
        <div className="container products-catalog-layout">
          <aside className="products-catalog-sidebar" aria-label="Filter produk">
            <CatalogFilters {...filterProps} idPrefix="desktop" />
          </aside>

          <div className="products-catalog-main">
            <div className="products-catalog-toolbar">
              <form className="products-catalog-search" role="search" onSubmit={handleSearch}>
                <label className="sr-only" htmlFor="catalog-query">Cari produk</label>
                <FiSearch aria-hidden="true" />
                <input
                  id="catalog-query"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Contoh: lampu meja atau tripod"
                />
                <button type="submit">Cari</button>
              </form>

              <label className="products-catalog-sort">
                <span>Urutkan</span>
                <select
                  value={sortParam}
                  onChange={(event) => updateParams({
                    urut: event.target.value === "recommended" ? null : event.target.value,
                  })}
                >
                  <option value="recommended">Rekomendasi</option>
                  <option value="newest">Terbaru dibahas</option>
                  <option value="name-asc">Nama A–Z</option>
                </select>
              </label>

              <button
                className="products-catalog-filter-button"
                type="button"
                onClick={() => setFilterOpen(true)}
                aria-haspopup="dialog"
              >
                <FiFilter aria-hidden="true" /> Filter
              </button>
            </div>

            <div className="products-catalog-result-bar" aria-live="polite">
              <div className="products-catalog-result-count">
                <strong>{result.length} produk</strong> ditemukan
              </div>

              <div className="products-catalog-active-filters" aria-label="Filter aktif">
                {activeFilters.map((filter) => (
                  <span className="products-catalog-chip" key={filter.key}>
                    {filter.label}
                    <button
                      type="button"
                      onClick={() => removeActiveFilter(filter.key)}
                      aria-label={`Hapus filter ${filter.label}`}
                    >
                      <FiX aria-hidden="true" />
                    </button>
                  </span>
                ))}

                {hasActiveFilters ? (
                  <button className="products-catalog-reset" type="button" onClick={resetFilters}>
                    <FiRefreshCw aria-hidden="true" /> Reset semua
                  </button>
                ) : null}
              </div>
            </div>

            {result.length ? (
              <ProductGrid products={result} priorityCount={4} variant="catalog" />
            ) : (
              <EmptyState
                title="Belum ada produk yang cocok"
                description="Periksa ejaan atau hapus beberapa filter. Data contoh saat ini masih terbatas."
                action={(
                  <button className="button button--primary" type="button" onClick={resetFilters}>
                    Tampilkan semua produk
                  </button>
                )}
              />
            )}
          </div>
        </div>
      </section>

      <CatalogFilterDrawer open={filterOpen} onClose={closeFilterDrawer}>
        <CatalogFilters {...filterProps} idPrefix="mobile" showHeader={false} />
        <div className="catalog-filter-drawer__footer">
          <button className="button button--secondary" type="button" onClick={resetFilters}>
            Reset filter
          </button>
          <button className="button button--primary" type="button" onClick={closeFilterDrawer}>
            Lihat {result.length} produk
          </button>
        </div>
      </CatalogFilterDrawer>
    </>
  );
};

export default ProductsPage;
