import { useCallback, useMemo, useState } from "react";
import { FiArrowRight, FiFilter } from "react-icons/fi";
import Seo from "../components/common/Seo";
import CatalogFilters from "../components/catalog/CatalogFilters";
import CatalogFilterDrawer from "../components/catalog/CatalogFilterDrawer";
import CatalogHero from "../components/catalog/CatalogHero.jsx";
import CatalogResultsHeader from "../components/catalog/CatalogResultsHeader.jsx";
import ProductGrid from "../components/catalog/ProductGrid";
import { AffiliateDisclosureNote } from "../components/catalog/AffiliateLinkButton";
import EmptyState from "../components/feedback/EmptyState";
import SearchAutocomplete from "../components/common/SearchAutocomplete";
import {
  categories,
  collections,
  getPrimaryAffiliateLink,
  products,
  searchProducts,
} from "../utils/catalog";
import { useCatalogScrollRestoration } from "../hooks/useCatalogScrollRestoration";
import { useCatalogQueryState } from "../hooks/useCatalogQueryState.js";
import { withBasePath } from "../config/site";
import { createCollectionPageJsonLd } from "../utils/structuredData";

const catalogHeroStyle = {
  "--catalog-hero-image": `url("${withBasePath("images/hero/catalog-kitchen-desktop.webp")}")`,
  "--catalog-hero-image-mobile": `url("${withBasePath("images/hero/catalog-kitchen-mobile.webp")}")`,
};

const ProductsPage = () => {
  useCatalogScrollRestoration();
  const categorySlugs = useMemo(() => categories.map((category) => category.slug), []);
  const collectionSlugs = useMemo(() => collections.map((collection) => collection.slug), []);
  const {
    values: {
      query: queryParam,
      category: categoryParam,
      collection: collectionParam,
      sort: sortParam,
      featured: featuredParam,
      newest: newestParam,
    },
    query,
    setQuery,
    searchInputRef,
    updateParams,
    resetFilters,
  } = useCatalogQueryState({ categorySlugs, collectionSlugs });
  const [filterOpen, setFilterOpen] = useState(false);

  const result = useMemo(() => searchProducts({
    query: queryParam,
    category: categoryParam,
    collection: collectionParam,
    sort: sortParam,
    featured: featuredParam,
    newest: newestParam,
  }), [categoryParam, collectionParam, featuredParam, newestParam, queryParam, sortParam]);

  const hasDirectMarketplaceLinks = useMemo(
    () => result.some((product) => Boolean(getPrimaryAffiliateLink(product))),
    [result],
  );

  const categoryCounts = useMemo(() => products.reduce((counts, product) => {
    counts.all += 1;
    counts[product.categorySlug] = (counts[product.categorySlug] || 0) + 1;
    return counts;
  }, { all: 0 }), []);

  const collectionCounts = useMemo(() => products.reduce((counts, product) => {
    counts.all += 1;
    (product.collectionSlugs || []).forEach((slug) => {
      counts[slug] = (counts[slug] || 0) + 1;
    });
    return counts;
  }, { all: 0 }), []);

  const handleSearch = (nextQuery) => updateParams({ q: nextQuery || null });

  const closeFilterDrawer = useCallback(() => setFilterOpen(false), []);

  const selectedCategory = categories.find((category) => category.slug === categoryParam) || null;
  const selectedCollection = collections.find((collection) => collection.slug === collectionParam) || null;
  const featuredCount = products.filter((product) => product.featured).length;
  const newestCount = products.filter((product) => product.newest).length;
  const hasActiveFilters = Boolean(
    queryParam
    || categoryParam !== "all"
    || collectionParam !== "all"
    || featuredParam
    || newestParam
    || sortParam !== "recommended",
  );

  const activeFilters = [
    queryParam ? { key: "q", label: `Pencarian: ${queryParam}` } : null,
    selectedCategory ? { key: "kategori", label: selectedCategory.name } : null,
    selectedCollection ? { key: "koleksi", label: selectedCollection.name } : null,
    featuredParam ? { key: "pilihan", label: "Pilihan DicekOut" } : null,
    newestParam ? { key: "terbaru", label: "Terbaru dibahas" } : null,
    sortParam !== "recommended" ? {
      key: "urut",
      label: sortParam === "newest" ? "Urutan: terbaru" : "Urutan: nama A–Z",
    } : null,
  ].filter(Boolean);

  const removeActiveFilter = (key) => {
    if (key === "q") setQuery("");
    updateParams({ [key]: null });
  };

  const filterProps = {
    categories,
    categoryCounts,
    collections,
    collectionCounts,
    selectedCategory: categoryParam,
    selectedCollection: collectionParam,
    featuredOnly: featuredParam,
    newestOnly: newestParam,
    featuredCount,
    newestCount,
    onCategoryChange: (value) => updateParams({ kategori: value === "all" ? null : value }),
    onCollectionChange: (value) => updateParams({ koleksi: value === "all" ? null : value }),
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
        path="produk"
        canonicalPath="produk"
        noindex={hasActiveFilters}
        jsonLd={createCollectionPageJsonLd({
          name: "Semua Produk Rekomendasi",
          description: "Katalog produk rekomendasi DicekOut.",
          path: "produk",
          breadcrumbs: [
            { name: "Beranda", path: "" },
            { name: "Semua Produk", path: "produk" },
          ],
        })}
      />

      <CatalogHero
        style={catalogHeroStyle}
        productCount={products.length}
        categoryCount={categories.length}
      />

      <section className="products-catalog-section section--surface" id="catalog-products">
        <div className="container products-catalog-shell">
          <div className="products-catalog-toolbar">
            <SearchAutocomplete
              value={query}
              onValueChange={setQuery}
              onSubmit={handleSearch}
              inputRef={searchInputRef}
              inputId="catalog-query"
              placeholder="Cari produk, kategori, atau kebutuhan..."
              formClassName="products-catalog-search"
            />

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

          <div className="products-catalog-layout">
            <aside className="products-catalog-sidebar" aria-label="Filter produk">
              <CatalogFilters {...filterProps} idPrefix="desktop" />
            </aside>

            <div className="products-catalog-main">
              <CatalogResultsHeader
                query={queryParam}
                resultCount={result.length}
                activeFilters={activeFilters}
                hasActiveFilters={hasActiveFilters}
                onRemoveFilter={removeActiveFilter}
                onReset={resetFilters}
              />

              {result.length ? (
                <>
                  {hasDirectMarketplaceLinks ? <AffiliateDisclosureNote compact className="catalog-affiliate-disclosure" /> : null}
                  <ProductGrid products={result} priorityCount={4} variant="catalog" />
                </>
              ) : (
                <div className="catalog-empty-results">
                  <EmptyState
                    title="Belum ada produk yang cocok"
                    description="Coba nama sehari-hari, fungsi barang, kategori lain, atau hapus beberapa filter."
                    action={(
                      <button className="button button--primary" type="button" onClick={resetFilters}>
                        Tampilkan semua produk
                      </button>
                    )}
                  />
                  <div className="catalog-empty-suggestions">
                    <h2>Jelajahi cara lain</h2>
                    <div>
                      {categories.slice(0, 3).map((category) => (
                        <button key={category.id} type="button" onClick={() => updateParams({ kategori: category.slug, q: null })}>
                          {category.name} <FiArrowRight aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
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
