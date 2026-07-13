import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiCheckCircle,
  FiSearch,
} from "react-icons/fi";
import SearchBar from "../components/common/SearchBar";
import SectionHeader from "../components/common/SectionHeader";
import Seo from "../components/common/Seo";
import CategoryCard from "../components/catalog/CategoryCard";
import CollectionCard from "../components/catalog/CollectionCard";
import ProductGrid from "../components/catalog/ProductGrid";
import { SITE, toAbsoluteUrl } from "../config/site";
import { categories, collections, products } from "../utils/catalog";

const featuredProducts = products.filter((product) => product.featured).slice(0, 4);
const latestProducts = products.filter((product) => product.newest).slice(0, 4);

const HomePage = () => {
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
          <h1>Cari produknya. <span>DicekOut.</span></h1>
          <p className="hero-tagline">Rekomendasi produk pilihan dari konten yang kamu lihat.</p>
          <strong className="hero-brandline">DICEKOUT.ID</strong>

          <div className="hero-search__form">
            <SearchBar placeholder="Cari nama produk atau kata dari video..." />
          </div>

          <div className="hero-categories" aria-labelledby="hero-category-title">
            <div className="hero-categories__heading">
              <div>
                <span className="eyebrow">Jelajahi lebih cepat</span>
                <h2 id="hero-category-title">Kategori produk affiliate</h2>
              </div>
              <Link to="/produk">Lihat semua produk <FiArrowRight aria-hidden="true" /></Link>
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

      <section className="section section--soft">
        <div className="container">
          <SectionHeader
            eyebrow="Baru dibahas"
            title="Produk dari konten terbaru"
            description="Pengunjung dapat langsung menemukan produk yang baru saja mereka lihat di konten Anda."
            linkTo="/koleksi/produk-dari-video-terbaru"
            linkLabel="Buka koleksi"
          />
          <ProductGrid
            products={latestProducts}
            priorityCount={4}
            mobileCompact
            ariaLabel="Produk dari konten terbaru"
          />
        </div>
      </section>

      <section className="section section--surface">
        <div className="container">
          <SectionHeader
            eyebrow="Pilihan DicekOut"
            title="Rekomendasi yang mudah dipahami"
            description="Setiap produk memiliki alasan rekomendasi, perhatian, dan tautan marketplace yang transparan."
            linkTo="/produk"
          />
          <ProductGrid
            products={featuredProducts}
            mobileCompact
            ariaLabel="Pilihan DicekOut"
          />
        </div>
      </section>

      <section className="section section--aqua">
        <div className="container">
          <SectionHeader
            eyebrow="Lebih dari kategori"
            title="Koleksi berdasarkan kebutuhan"
            description="Satu produk dapat muncul di koleksi video, setup meja, atau kebutuhan rumah tanpa diduplikasi."
          />
          <div className="collection-grid">
            {collections.map((collection) => <CollectionCard key={collection.id} collection={collection} />)}
          </div>
        </div>
      </section>

      <section className="trust-section section section--surface">
        <div className="container trust-section__grid">
          <div className="trust-section__copy">
            <span className="eyebrow">Rekomendasi yang lebih jujur</span>
            <h2>Tidak sekadar menaruh link.</h2>
            <p>
              DicekOut dirancang untuk memberi konteks sebelum pengunjung menuju marketplace.
              Tidak ada checkout internal, countdown palsu, atau klaim stok yang tidak terverifikasi.
            </p>
            <Link className="button button--primary" to="/tentang">
              Cara kami memilih produk <FiArrowRight aria-hidden="true" />
            </Link>
          </div>

          <div className="trust-list">
            <article>
              <FiCheckCircle aria-hidden="true" />
              <div><h3>Alasan rekomendasi</h3><p>Jelaskan mengapa produk layak dipertimbangkan.</p></div>
            </article>
            <article>
              <FiCheckCircle aria-hidden="true" />
              <div><h3>Hal yang perlu diperhatikan</h3><p>Kekurangan dan batasan tidak disembunyikan.</p></div>
            </article>
            <article>
              <FiCheckCircle aria-hidden="true" />
              <div><h3>Link affiliate transparan</h3><p>Disclosure ditampilkan dekat dengan tombol marketplace.</p></div>
            </article>
          </div>
        </div>
      </section>

      <section className="disclosure-banner">
        <div className="container disclosure-banner__inner">
          <div>
            <span className="eyebrow">Transparansi</span>
            <h2>Beberapa link dapat menghasilkan komisi untuk DicekOut.</h2>
            <p>Komisi tidak menambah harga yang dibayar pengunjung di marketplace.</p>
          </div>
          <Link className="button button--light" to="/disclosure">Baca disclosure</Link>
        </div>
      </section>
    </>
  );
};

export default HomePage;
