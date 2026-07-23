import { Link, useParams } from "react-router-dom";
import { FiArrowLeft, FiLayers } from "react-icons/fi";
import Seo from "../components/common/Seo";
import Breadcrumbs from "../components/common/Breadcrumbs";
import ProductGrid from "../components/catalog/ProductGrid";
import NotFoundPage from "./NotFoundPage";
import { getCollection, getProductsByCollection } from "../utils/catalog";
import { useCatalogScrollRestoration } from "../hooks/useCatalogScrollRestoration";
import { createCollectionPageJsonLd } from "../utils/structuredData";

const CollectionPage = () => {
  useCatalogScrollRestoration();
  const { slug } = useParams();
  const collection = getCollection(slug);
  if (!collection) return <NotFoundPage />;

  const collectionProducts = getProductsByCollection(slug);

  return (
    <>
      <Seo
        title={`${collection.name} | Tema DicekOut`}
        description={collection.description}
        path={`koleksi/${collection.slug}`}
        noindex={Boolean(collection.demo)}
        jsonLd={createCollectionPageJsonLd({
          name: collection.name,
          description: collection.description,
          path: `koleksi/${collection.slug}`,
          breadcrumbs: [
            { name: "Beranda", path: "" },
            { name: "Tema", path: "koleksi" },
            { name: collection.name, path: `koleksi/${collection.slug}` },
          ],
        })}
      />

      <section className="discovery-detail-hero discovery-detail-hero--theme">
        <div className="container">
          <Breadcrumbs items={[
            { label: "Beranda", to: "/" },
            { label: "Tema", to: "/koleksi" },
            { label: collection.name },
          ]} />

          <div className="discovery-detail-hero__layout">
            <div className="discovery-detail-hero__content">
              <span className="eyebrow"><FiLayers aria-hidden="true" /> {collection.eyebrow}</span>
              <h1>{collection.name}</h1>
              <p>{collection.description}</p>
              {collection.demo ? <span className="discovery-detail-hero__note">Tema contoh untuk pratinjau desain</span> : null}
            </div>

            <div className="discovery-detail-hero__summary">
              <span className="category-card__icon discovery-detail-hero__icon" aria-hidden="true"><FiLayers /></span>
              <strong>{collectionProducts.length}</strong>
              <span>produk dalam tema</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--surface discovery-results">
        <div className="container">
          <div className="inline-heading discovery-results__header">
            <div>
              <span className="eyebrow">Pilihan dalam tema</span>
              <h2>Produk yang saling melengkapi</h2>
              <p>Jelajahi setiap produk dan tentukan sendiri mana yang paling sesuai dengan kebutuhanmu.</p>
            </div>
            <Link className="text-link" to="/koleksi"><FiArrowLeft aria-hidden="true" /> Tema lainnya</Link>
          </div>
          <ProductGrid products={collectionProducts} priorityCount={4} />
        </div>
      </section>
    </>
  );
};

export default CollectionPage;
