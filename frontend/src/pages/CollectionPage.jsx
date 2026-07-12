import { Link, useParams } from "react-router-dom";
import { FiArrowLeft, FiPlayCircle } from "react-icons/fi";
import Seo from "../components/common/Seo";
import Breadcrumbs from "../components/common/Breadcrumbs";
import ProductGrid from "../components/catalog/ProductGrid";
import NotFoundPage from "./NotFoundPage";
import { getCollection, getProductsByCollection } from "../utils/catalog";

const CollectionPage = () => {
  const { slug } = useParams();
  const collection = getCollection(slug);
  if (!collection) return <NotFoundPage />;

  const collectionProducts = getProductsByCollection(slug);

  return (
    <>
      <Seo
        title={`${collection.name} | Koleksi DicekOut`}
        description={collection.description}
        path={`koleksi/${collection.slug}`}
      />

      <section className="page-hero page-hero--collection">
        <div className="container">
          <Breadcrumbs items={[
            { label: "Beranda", to: "/" },
            { label: "Koleksi", to: "/produk" },
            { label: collection.name },
          ]} />
          <span className="eyebrow"><FiPlayCircle aria-hidden="true" /> {collection.eyebrow}</span>
          <h1>{collection.name}</h1>
          <p>{collection.description}</p>
          {collection.demo ? <span className="page-hero__count">Koleksi contoh untuk pratinjau desain</span> : null}
        </div>
      </section>

      <section className="section section--surface">
        <div className="container">
          <div className="inline-heading">
            <div>
              <h2>Produk dalam koleksi</h2>
              <p>Satu halaman dapat dipakai sebagai link langsung dari caption atau bio media sosial.</p>
            </div>
            <Link className="text-link" to="/produk"><FiArrowLeft aria-hidden="true" /> Semua produk</Link>
          </div>
          <ProductGrid products={collectionProducts} priorityCount={4} />
        </div>
      </section>
    </>
  );
};

export default CollectionPage;
