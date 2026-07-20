import Breadcrumbs from "../common/Breadcrumbs";

const CatalogHero = ({ style, productCount, categoryCount }) => (
  <section className="page-hero page-hero--compact page-hero--catalog" style={style}>
    <div className="container">
      <div className="page-hero__catalog-row">
        <div className="page-hero__catalog-copy">
          <Breadcrumbs items={[{ label: "Beranda", to: "/" }, { label: "Semua Produk" }]} />
          <span className="eyebrow">Katalog DicekOut</span>
          <h1>Temukan produk yang sedang kamu cari.</h1>
          <p>Cari berdasarkan nama, kebutuhan, atau kategori yang paling relevan.</p>
          <div className="page-hero__catalog-meta" aria-label="Ringkasan katalog">
            <span><strong>{productCount}</strong> produk tersedia</span>
            <span><strong>{categoryCount}</strong> kategori pilihan</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default CatalogHero;
