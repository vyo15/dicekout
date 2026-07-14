import Breadcrumbs from "../components/common/Breadcrumbs";
import Seo from "../components/common/Seo";
import CollectionCard from "../components/catalog/CollectionCard";
import { collections } from "../utils/catalog";

const CollectionsPage = () => (
  <>
    <Seo
      title="Koleksi Rekomendasi | DicekOut"
      description="Jelajahi koleksi rekomendasi DicekOut berdasarkan kebutuhan dan konteks penggunaan."
      path="koleksi"
    />
    <section className="page-hero page-hero--compact">
      <div className="container">
        <Breadcrumbs items={[{ label: "Beranda", to: "/" }, { label: "Koleksi" }]} />
        <span className="eyebrow">Berdasarkan kebutuhan</span>
        <h1>Koleksi rekomendasi</h1>
        <p>Temukan beberapa produk yang dikelompokkan berdasarkan kebutuhan, bukan hanya kategori teknis.</p>
      </div>
    </section>
    <section className="section section--surface">
      <div className="container collection-grid">
        {collections.map((collection) => <CollectionCard key={collection.id} collection={collection} />)}
      </div>
    </section>
  </>
);

export default CollectionsPage;
