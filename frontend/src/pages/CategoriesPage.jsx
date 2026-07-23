import Breadcrumbs from "../components/common/Breadcrumbs";
import Seo from "../components/common/Seo";
import CategoryCard from "../components/catalog/CategoryCard";
import { categories, products } from "../utils/catalog";
import { createCollectionPageJsonLd } from "../utils/structuredData";

const CategoriesPage = () => (
  <>
    <Seo
      title="Kategori Produk | DicekOut"
      description="Jelajahi rekomendasi produk DicekOut berdasarkan kategori."
      path="kategori"
      jsonLd={createCollectionPageJsonLd({
        name: "Kategori Produk",
        description: "Jelajahi rekomendasi produk DicekOut berdasarkan kategori.",
        path: "kategori",
        breadcrumbs: [{ name: "Beranda", path: "" }, { name: "Kategori", path: "kategori" }],
      })}
    />

    <section className="discovery-hero discovery-hero--categories">
      <div className="container discovery-hero__layout">
        <div className="discovery-hero__content">
          <Breadcrumbs items={[{ label: "Beranda", to: "/" }, { label: "Kategori" }]} />
          <span className="eyebrow">Jelajahi berdasarkan jenis</span>
          <h1>Temukan produk dari kategori yang kamu butuhkan.</h1>
          <p>Mulai dari kelompok produk yang paling relevan, lalu lihat pilihan yang sudah dirangkum dengan lebih terarah.</p>
        </div>

        <dl className="discovery-hero__stats" aria-label="Ringkasan katalog kategori">
          <div>
            <dt>{categories.length}</dt>
            <dd>Kategori</dd>
          </div>
          <div>
            <dt>{products.length}</dt>
            <dd>Produk terpilih</dd>
          </div>
        </dl>
      </div>
    </section>

    <section className="section section--surface discovery-directory">
      <div className="container">
        <header className="discovery-directory__header">
          <div>
            <span className="eyebrow">Pilih jalur pencarian</span>
            <h2>Kategori produk</h2>
          </div>
          <p>Setiap kategori berisi pilihan yang sudah dikelompokkan agar lebih cepat dijelajahi.</p>
        </header>

        <div className="category-grid category-grid--directory">
          {categories.map((category) => <CategoryCard key={category.id} category={category} />)}
        </div>
      </div>
    </section>
  </>
);

export default CategoriesPage;
