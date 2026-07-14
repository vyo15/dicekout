import { FiBookmark, FiTrash2 } from "react-icons/fi";
import { Link } from "react-router-dom";
import Breadcrumbs from "../components/common/Breadcrumbs";
import Seo from "../components/common/Seo";
import ProductGrid from "../components/catalog/ProductGrid";
import EmptyState from "../components/feedback/EmptyState";
import { useProductPreferences } from "../hooks/useProductPreferences";
import { clearSavedProducts } from "../utils/productPreferences";

const SavedProductsPage = () => {
  const { savedProducts } = useProductPreferences();

  return (
    <>
      <Seo
        title="Produk Tersimpan | DicekOut"
        description="Lihat kembali produk DicekOut yang disimpan di perangkat ini."
        path="tersimpan"
        noindex
      />

      <section className="page-hero page-hero--compact">
        <div className="container">
          <Breadcrumbs items={[{ label: "Beranda", to: "/" }, { label: "Produk Tersimpan" }]} />
          <span className="eyebrow"><FiBookmark aria-hidden="true" /> Tersimpan di perangkat</span>
          <h1>Produk yang ingin kamu lihat lagi.</h1>
          <p>Daftar ini hanya tersimpan di browser dan perangkat yang sedang digunakan.</p>
        </div>
      </section>

      <section className="section section--surface">
        <div className="container">
          {savedProducts.length ? (
            <>
              <div className="inline-heading saved-products-heading">
                <div>
                  <h2>{savedProducts.length} produk tersimpan</h2>
                  <p>Kamu dapat menghapus produk satu per satu melalui tombol bookmark pada kartu.</p>
                </div>
                <button className="button button--secondary" type="button" onClick={clearSavedProducts}>
                  <FiTrash2 aria-hidden="true" /> Hapus semua
                </button>
              </div>
              <ProductGrid products={savedProducts} variant="catalog" />
            </>
          ) : (
            <EmptyState
              title="Belum ada produk tersimpan"
              description="Gunakan tombol bookmark pada kartu atau halaman detail untuk menyimpan produk."
              action={<Link className="button button--primary" to="/produk">Jelajahi produk</Link>}
            />
          )}
        </div>
      </section>
    </>
  );
};

export default SavedProductsPage;
