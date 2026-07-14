import { Link } from "react-router-dom";
import { FiArrowRight, FiCheck } from "react-icons/fi";
import SearchBar from "../components/common/SearchBar";
import SectionHeader from "../components/common/SectionHeader";
import Seo from "../components/common/Seo";
import CategoryCard from "../components/catalog/CategoryCard";
import ProductGrid from "../components/catalog/ProductGrid";
import { SITE, toAbsoluteUrl } from "../config/site";
import { categories, products } from "../utils/catalog";
import { useCatalogScrollRestoration } from "../hooks/useCatalogScrollRestoration";

const latestProducts = products.filter((product) => product.newest).slice(0, 8);
const homepageProducts = latestProducts.length ? latestProducts : products.slice(0, 8);
const homepageProductTitle = latestProducts.length
  ? "Produk dari konten terbaru"
  : "Jelajahi produk DicekOut";

const HomePage = () => {
  useCatalogScrollRestoration();
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.brandName,
    url: toAbsoluteUrl(""),
    description: SITE.description,
    potentialAction: {
      "@type": "SearchAction",
      target: `${toAbsoluteUrl("produk")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <Seo jsonLd={websiteJsonLd} />

      <section className="hero-section hero-section--search-first">
        <div className="hero-section__glow hero-section__glow--one" aria-hidden="true" />
        <div className="hero-section__glow hero-section__glow--two" aria-hidden="true" />
        <div className="hero-search container">
          <h1>
            Pilih yang kamu mau
            <span><strong>DICEKOUT.ID</strong> dulu</span>
          </h1>
          <p className="hero-tagline">Rekomendasi produk pilihan terbaik untuk kamu</p>

          <div className="hero-search__form">
            <SearchBar placeholder="Cari nama produk atau kata dari video..." />
          </div>

          <ul className="hero-benefits" aria-label="Keunggulan rekomendasi DicekOut">
            <li><FiCheck aria-hidden="true" /> <span>Produk terpilih</span></li>
            <li><FiCheck aria-hidden="true" /> <span>Sudah kami riset</span></li>
            <li><FiCheck aria-hidden="true" /> <span>Tentukan pilihanmu</span></li>
          </ul>

          <div className="hero-categories" aria-labelledby="hero-category-title">
            <div className="hero-categories__heading">
              <h2 id="hero-category-title">Jelajahi kategori</h2>
              <Link to="/kategori">Lihat semua kategori <FiArrowRight aria-hidden="true" /></Link>
            </div>
            <div className="hero-category-scroll">
              <div className="hero-category-grid" aria-label="Kategori produk">
                {categories.map((category) => (
                  <CategoryCard key={category.id} category={category} variant="compact" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--surface home-latest-section">
        <div className="container">
          <SectionHeader
            title={homepageProductTitle}
            linkTo="/produk"
            linkLabel="Lihat semua produk"
          />
          <div className="home-latest-products">
            <ProductGrid
              products={homepageProducts}
              priorityCount={4}
              mobileCompact
              ariaLabel={homepageProductTitle}
            />
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
