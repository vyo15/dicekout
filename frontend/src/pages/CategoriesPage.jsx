import Breadcrumbs from "../components/common/Breadcrumbs";
import Seo from "../components/common/Seo";
import CategoryCard from "../components/catalog/CategoryCard";
import { categories, products } from "../utils/catalog";

const CategoriesPage = () => (
  <>
    <Seo
      title="Kategori Produk | DicekOut"
      description="Jelajahi rekomendasi produk DicekOut berdasarkan kategori."
      path="kategori"
    />
    <section className="page-hero page-hero--compact">
      <div className="container">
        <Breadcrumbs items={[{ label: "Beranda", to: "/" }, { label: "Kategori" }]} />
        <span className="eyebrow">Jelajahi katalog</span>
        <h1>Kategori produk</h1>
        <p>Pilih jenis barang yang paling relevan dari {products.length} produk rekomendasi saat ini.</p>
      </div>
    </section>
    <section className="section section--surface">
      <div className="container category-grid">
        {categories.map((category) => <CategoryCard key={category.id} category={category} />)}
      </div>
    </section>
  </>
);

export default CategoriesPage;
