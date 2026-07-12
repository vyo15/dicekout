import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiFilter, FiRefreshCw, FiSearch } from "react-icons/fi";
import Seo from "../components/common/Seo";
import Breadcrumbs from "../components/common/Breadcrumbs";
import ProductGrid from "../components/catalog/ProductGrid";
import EmptyState from "../components/feedback/EmptyState";
import { categories, searchProducts } from "../utils/catalog";

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  const categoryParam = searchParams.get("kategori") || "all";
  const sortParam = searchParams.get("urut") || "recommended";
  const [query, setQuery] = useState(queryParam);

  useEffect(() => setQuery(queryParam), [queryParam]);

  const result = useMemo(() => searchProducts({
    query: queryParam,
    category: categoryParam,
    sort: sortParam,
  }), [categoryParam, queryParam, sortParam]);

  const updateParam = (key, value, defaultValue) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === defaultValue) next.delete(key);
    else next.set(key, value);
    setSearchParams(next);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    updateParam("q", query.trim(), "");
  };

  const resetFilters = () => {
    setQuery("");
    setSearchParams({});
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

      <section className="page-hero page-hero--compact">
        <div className="container">
          <Breadcrumbs items={[{ label: "Beranda", to: "/" }, { label: "Semua Produk" }]} />
          <span className="eyebrow">Katalog DicekOut</span>
          <h1>Temukan produk yang sedang kamu cari.</h1>
          <p>Cari berdasarkan nama, kata dari video, atau pilih kategori yang relevan.</p>
        </div>
      </section>

      <section className="catalog-section section section--surface">
        <div className="container">
          <div className="catalog-toolbar">
            <form className="catalog-search" role="search" onSubmit={handleSearch}>
              <label htmlFor="catalog-query">Cari produk</label>
              <div className="catalog-search__field">
                <FiSearch aria-hidden="true" />
                <input
                  id="catalog-query"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Contoh: lampu meja atau tripod"
                />
                <button type="submit">Cari</button>
              </div>
            </form>

            <div className="catalog-filters" aria-label="Filter katalog">
              <label>
                <span><FiFilter aria-hidden="true" /> Kategori</span>
                <select
                  value={categoryParam}
                  onChange={(event) => updateParam("kategori", event.target.value, "all")}
                >
                  <option value="all">Semua kategori</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.slug}>{category.name}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Urutkan</span>
                <select
                  value={sortParam}
                  onChange={(event) => updateParam("urut", event.target.value, "recommended")}
                >
                  <option value="recommended">Rekomendasi</option>
                  <option value="newest">Terbaru dibahas</option>
                  <option value="name-asc">Nama A–Z</option>
                </select>
              </label>
            </div>
          </div>

          <div className="catalog-results-heading">
            <div>
              <strong>{result.length} produk ditemukan</strong>
              {queryParam ? <span>untuk “{queryParam}”</span> : null}
            </div>
            {(queryParam || categoryParam !== "all" || sortParam !== "recommended") ? (
              <button className="text-button" type="button" onClick={resetFilters}>
                <FiRefreshCw aria-hidden="true" /> Reset filter
              </button>
            ) : null}
          </div>

          {result.length ? (
            <ProductGrid products={result} priorityCount={4} />
          ) : (
            <EmptyState
              title="Belum ada produk yang cocok"
              description="Periksa ejaan atau gunakan kategori lain. Data contoh saat ini masih terbatas."
              action={<button className="button button--primary" type="button" onClick={resetFilters}>Tampilkan semua produk</button>}
            />
          )}
        </div>
      </section>
    </>
  );
};

export default ProductsPage;
