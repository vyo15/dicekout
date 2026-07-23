import Breadcrumbs from "../components/common/Breadcrumbs";
import Seo from "../components/common/Seo";
import CollectionCard from "../components/catalog/CollectionCard";
import { collections, products } from "../utils/catalog";
import { createCollectionPageJsonLd } from "../utils/structuredData";

const CollectionsPage = () => (
  <>
    <Seo
      title="Tema Rekomendasi | DicekOut"
      description="Jelajahi tema rekomendasi DicekOut berdasarkan kebutuhan dan konteks penggunaan."
      path="koleksi"
      jsonLd={createCollectionPageJsonLd({
        name: "Tema Rekomendasi",
        description: "Jelajahi tema rekomendasi DicekOut berdasarkan kebutuhan dan konteks penggunaan.",
        path: "koleksi",
        breadcrumbs: [{ name: "Beranda", path: "" }, { name: "Tema", path: "koleksi" }],
      })}
    />

    <section className="discovery-hero discovery-hero--themes">
      <div className="container discovery-hero__layout">
        <div className="discovery-hero__content">
          <Breadcrumbs items={[{ label: "Beranda", to: "/" }, { label: "Tema" }]} />
          <span className="eyebrow">Dikelompokkan berdasarkan kebutuhan</span>
          <h1>Inspirasi produk dalam tema yang lebih mudah dipahami.</h1>
          <p>Lihat beberapa produk yang saling melengkapi untuk aktivitas, ruang, atau kebutuhan tertentu.</p>
        </div>

        <dl className="discovery-hero__stats" aria-label="Ringkasan tema rekomendasi">
          <div>
            <dt>{collections.length}</dt>
            <dd>Tema pilihan</dd>
          </div>
          <div>
            <dt>{products.length}</dt>
            <dd>Produk di katalog</dd>
          </div>
        </dl>
      </div>
    </section>

    <section className="section section--surface discovery-directory">
      <div className="container">
        <header className="discovery-directory__header">
          <div>
            <span className="eyebrow">Lebih dari sekadar kategori</span>
            <h2>Tema rekomendasi</h2>
          </div>
          <p>Gunakan tema untuk melihat kumpulan produk yang punya konteks penggunaan yang sama.</p>
        </header>

        <div className="collection-grid collection-grid--directory">
          {collections.map((collection) => <CollectionCard key={collection.id} collection={collection} />)}
        </div>
      </div>
    </section>
  </>
);

export default CollectionsPage;
