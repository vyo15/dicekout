import { Link, useParams } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import Seo from "../components/common/Seo";
import Breadcrumbs from "../components/common/Breadcrumbs";
import ProductGrid from "../components/catalog/ProductGrid";
import { CategoryIcon } from "../components/catalog/CategoryCard";
import NotFoundPage from "./NotFoundPage";
import { getCategory, getProductsByCategory } from "../utils/catalog";
import { useCatalogScrollRestoration } from "../hooks/useCatalogScrollRestoration";
import { createCollectionPageJsonLd } from "../utils/structuredData";

const CategoryPage = () => {
  useCatalogScrollRestoration();
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
        jsonLd={createCollectionPageJsonLd({
          name: category.name,
          description: category.description,
          path: `kategori/${category.slug}`,
          breadcrumbs: [
            { name: "Beranda", path: "" },
            { name: "Kategori", path: "kategori" },
            { name: category.name, path: `kategori/${category.slug}` },
          ],
        })}
      />

      <section className={`discovery-detail-hero discovery-detail-hero--${category.accent}`}>
        <div className="container">
          <Breadcrumbs items={[
            { label: "Beranda", to: "/" },
            { label: "Kategori", to: "/kategori" },
            { label: category.name },
          ]} />

          <div className="discovery-detail-hero__layout">
            <div className="discovery-detail-hero__content">
              <span className="eyebrow">Kategori produk</span>
              <h1>{category.name}</h1>
              <p>{category.description}</p>
            </div>

            <div className="discovery-detail-hero__summary">
              <CategoryIcon icon={category.icon} className="discovery-detail-hero__icon" />
              <strong>{categoryProducts.length}</strong>
              <span>produk pilihan</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--surface discovery-results">
        <div className="container">
          <div className="inline-heading discovery-results__header">
            <div>
              <span className="eyebrow">Pilihan dalam kategori</span>
              <h2>Produk {category.name}</h2>
              <p>Baca ringkasan, alasan rekomendasi, dan detail produknya sebelum menentukan pilihan.</p>
            </div>
            <Link className="text-link" to="/kategori"><FiArrowLeft aria-hidden="true" /> Kategori lainnya</Link>
          </div>
          <ProductGrid products={categoryProducts} priorityCount={4} />
        </div>
      </section>
    </>
  );
};

export default CategoryPage;
