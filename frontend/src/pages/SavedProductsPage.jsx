import { useEffect, useMemo, useState } from "react";
import { FiBookmark, FiSearch, FiTrash2, FiX } from "react-icons/fi";
import { Link } from "react-router-dom";
import Seo from "../components/common/Seo";
import ProductGrid from "../components/catalog/ProductGrid";
import { AffiliateDisclosureNote } from "../components/catalog/AffiliateLinkButton";
import EmptyState from "../components/feedback/EmptyState";
import { useProductPreferences } from "../hooks/useProductPreferences";
import {
  announceProductPreference,
  clearSavedProducts,
} from "../utils/productPreferences";
import { useCatalogScrollRestoration } from "../hooks/useCatalogScrollRestoration";
import {
  getCategory,
  getPrimaryAffiliateLink,
  normalizeSearchText,
} from "../utils/catalog";

const SavedProductsPage = () => {
  useCatalogScrollRestoration();
  const { savedProducts } = useProductPreferences();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [manageOpen, setManageOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const savedCategories = useMemo(() => {
    const seen = new Set();
    return savedProducts
      .map((product) => getCategory(product.categorySlug))
      .filter((category) => {
        if (!category || seen.has(category.slug)) return false;
        seen.add(category.slug);
        return true;
      });
  }, [savedProducts]);

  const showSearch = savedProducts.length >= 5;
  const showCategoryFilters = savedCategories.length > 1;

  useEffect(() => {
    if (!showSearch && query) setQuery("");
  }, [query, showSearch]);

  useEffect(() => {
    const selectedCategoryStillExists = selectedCategory === "all"
      || savedCategories.some((category) => category.slug === selectedCategory);
    if (!showCategoryFilters || !selectedCategoryStillExists) setSelectedCategory("all");
  }, [savedCategories, selectedCategory, showCategoryFilters]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);
    return savedProducts.filter((product) => {
      const category = getCategory(product.categorySlug);
      const matchesCategory = selectedCategory === "all" || product.categorySlug === selectedCategory;
      if (!matchesCategory) return false;
      if (!normalizedQuery) return true;
      return normalizeSearchText([
        product.name,
        product.summary,
        product.recommendationReason,
        category?.name,
        ...(product.keywords || []),
        ...(product.aliases || []),
      ].filter(Boolean).join(" ")).includes(normalizedQuery);
    });
  }, [query, savedProducts, selectedCategory]);

  const hasDirectMarketplaceLinks = filteredProducts.some((product) => Boolean(getPrimaryAffiliateLink(product)));

  const resetFilters = () => {
    setQuery("");
    setSelectedCategory("all");
  };

  const handleClearAll = () => {
    const result = clearSavedProducts();
    setManageOpen(false);
    setConfirmClear(false);
    resetFilters();

    if (!result.success) {
      announceProductPreference({
        message: "Koleksi tidak dapat dihapus di browser ini.",
        tone: "error",
      });
      return;
    }

    announceProductPreference({
      message: "Semua produk dihapus dari Koleksi.",
      undoIds: result.previousIds,
    });
  };

  return (
    <>
      <Seo
        title="Koleksi Kamu | DicekOut"
        description="Lihat kembali produk DicekOut yang disimpan di perangkat ini."
        path="tersimpan"
        noindex
      />

      <section className="saved-collection-hero">
        <div className="container saved-collection-hero__inner">
          <div>
            <span className="eyebrow"><FiBookmark aria-hidden="true" /> Disimpan di perangkat ini</span>
            <h1>Koleksi kamu</h1>
            <p>{savedProducts.length} produk tersimpan untuk dilihat kembali.</p>
          </div>
          {savedProducts.length ? (
            <button
              className="saved-collection-manage-button"
              type="button"
              onClick={() => {
                setManageOpen((value) => !value);
                setConfirmClear(false);
              }}
              aria-expanded={manageOpen}
            >
              {manageOpen ? <FiX aria-hidden="true" /> : <FiTrash2 aria-hidden="true" />}
              {manageOpen ? "Selesai" : "Kelola koleksi"}
            </button>
          ) : null}
        </div>
      </section>

      <section className="section section--surface saved-collection-section">
        <div className="container">
          {savedProducts.length ? (
            <>
              {manageOpen ? (
                <div className="saved-collection-manage" role="region" aria-label="Kelola Koleksi">
                  <div>
                    <strong>Kosongkan Koleksi</strong>
                    <p>Produk dapat dikembalikan melalui tombol Urungkan setelah dihapus.</p>
                  </div>
                  {confirmClear ? (
                    <div className="saved-collection-confirm">
                      <button type="button" onClick={() => setConfirmClear(false)}>Batal</button>
                      <button type="button" onClick={handleClearAll}>Ya, hapus semua</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setConfirmClear(true)}>
                      <FiTrash2 aria-hidden="true" /> Hapus semua
                    </button>
                  )}
                </div>
              ) : null}

              {(showSearch || showCategoryFilters) ? (
                <div className="saved-collection-tools">
                  {showSearch ? (
                    <label className="saved-collection-search">
                      <span className="sr-only">Cari di Koleksi</span>
                      <FiSearch aria-hidden="true" />
                      <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Cari produk tersimpan..."
                      />
                    </label>
                  ) : null}

                  {showCategoryFilters ? (
                    <div className="saved-collection-chips" aria-label="Filter kategori Koleksi">
                      <button
                        className={selectedCategory === "all" ? "active" : ""}
                        type="button"
                        onClick={() => setSelectedCategory("all")}
                      >
                        Semua
                      </button>
                      {savedCategories.map((category) => (
                        <button
                          className={selectedCategory === category.slug ? "active" : ""}
                          key={category.id}
                          type="button"
                          onClick={() => setSelectedCategory(category.slug)}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {filteredProducts.length ? (
                <>
                  <div className="saved-collection-result-heading">
                    <h2>{filteredProducts.length} produk</h2>
                    <p>Tekan ikon bookmark pada kartu untuk menghapus produk dari Koleksi.</p>
                  </div>
                  {hasDirectMarketplaceLinks ? <AffiliateDisclosureNote compact className="catalog-affiliate-disclosure" /> : null}
                  <ProductGrid products={filteredProducts} variant="catalog" />
                </>
              ) : (
                <EmptyState
                  title="Produk tidak ditemukan di Koleksi"
                  description="Coba kata pencarian atau kategori lain."
                  action={<button className="button button--secondary" type="button" onClick={resetFilters}>Reset pencarian</button>}
                />
              )}

              <p className="saved-collection-local-note">
                Koleksi disimpan di browser dan perangkat ini, sehingga tidak otomatis berpindah ke perangkat lain.
              </p>
            </>
          ) : (
            <EmptyState
              icon={FiBookmark}
              className="saved-collection-empty"
              title="Belum ada produk di Koleksi"
              description="Simpan produk yang menarik agar mudah ditemukan kembali."
              action={<Link className="button button--primary" to="/produk">Jelajahi produk</Link>}
            />
          )}
        </div>
      </section>
    </>
  );
};

export default SavedProductsPage;
