import { Link, useParams } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import Seo from "../components/common/Seo";
import Breadcrumbs from "../components/common/Breadcrumbs";
import ProductGrid from "../components/catalog/ProductGrid";
import NotFoundPage from "./NotFoundPage";
import { getCategory, getProductsByCategory } from "../utils/catalog";

const CategoryPage = () => {
  const { slug } = useParams();
  const category = getCategory(slug);
  if (!category) return <NotFoundPage />;

  const categoryProducts = getProductsByCategory(slug);

  return (
    <>
      <Seo
        title={`${category.name} | Rekomendasi DicekOut`}
        description={`${category.description} Jelajahi produk pilihan dalam kategori ${category.name}.`}
        path={`kategori/${category.slug}`}
      />

      <section className={`page-hero page-hero--category page-hero--${category.accent}`}>
        <div className="container">
          <Breadcrumbs items={[
            { label: "Beranda", to: "/" },
            { label: "Semua Produk", to: "/produk" },
            { label: category.name },
          ]} />
          <span className="eyebrow">Kategori</span>
          <h1>{category.name}</h1>
          <p>{category.description}</p>
          <span className="page-hero__count">{categoryProducts.length} produk tersedia</span>
        </div>
      </section>

      <section className="section section--surface">
        <div className="container">
          <div className="inline-heading">
            <div>
              <h2>Produk dalam kategori ini</h2>
              <p>Pilih produk untuk membaca detail dan alasan rekomendasinya.</p>
            </div>
            <Link className="text-link" to="/produk"><FiArrowLeft aria-hidden="true" /> Semua produk</Link>
          </div>
          <ProductGrid products={categoryProducts} priorityCount={4} />
        </div>
      </section>
    </>
  );
};

export default CategoryPage;
