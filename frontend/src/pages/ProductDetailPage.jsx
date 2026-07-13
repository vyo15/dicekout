import { Link, useParams } from "react-router-dom";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheck,
  FiExternalLink,
  FiInfo,
  FiTag,
  FiUserCheck,
  FiUserX,
  FiCalendar,
  FiPlayCircle,
} from "react-icons/fi";
import Seo from "../components/common/Seo";
import Breadcrumbs from "../components/common/Breadcrumbs";
import ShareButton from "../components/common/ShareButton";
import ProductGrid from "../components/catalog/ProductGrid";
import AffiliateLinkButton from "../components/catalog/AffiliateLinkButton";
import NotFoundPage from "./NotFoundPage";
import { SITE, toAbsoluteUrl, withBasePath } from "../config/site";
import { getSafeExternalUrl } from "../utils/urls";
import {
  getCategory,
  getCollection,
  getProduct,
  getRelatedProducts,
} from "../utils/catalog";

const ProductDetailPage = () => {
  const { slug } = useParams();
  const product = getProduct(slug);
  if (!product) return <NotFoundPage />;

  const category = getCategory(product.categorySlug);
  const relatedProducts = getRelatedProducts(product);
  const activeLinks = (product.affiliateLinks || []).filter((link) => link.status !== "inactive");
  const productCollections = (product.collectionSlugs || []).map(getCollection).filter(Boolean);
  const path = `produk/${product.slug}`;
  const shareUrl = toAbsoluteUrl(path);
  const reviewedLabel = product.reviewedAt
    ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(`${product.reviewedAt}T00:00:00Z`))
    : null;
  const contentReferences = (product.contentReferences || []).map((reference) => ({
    ...reference,
    safeUrl: getSafeExternalUrl(reference.url),
  })).filter((reference) => reference.safeUrl);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Beranda", item: toAbsoluteUrl("") },
      { "@type": "ListItem", position: 2, name: "Produk", item: toAbsoluteUrl("produk") },
      { "@type": "ListItem", position: 3, name: product.name, item: toAbsoluteUrl(path) },
    ],
  };

  const handleImageError = (event) => {
    event.currentTarget.src = withBasePath("images/products/fallback.svg");
  };

  return (
    <>
      <Seo
        title={`${product.name} | DicekOut`}
        description={product.summary}
        path={path}
        image={product.ogImage || SITE.defaultOgImage}
        noindex={product.demo || !SITE.allowIndexing}
        jsonLd={breadcrumbJsonLd}
      />

      <section className="product-detail-section section section--surface">
        <div className="container">
          <Breadcrumbs items={[
            { label: "Beranda", to: "/" },
            { label: "Semua Produk", to: "/produk" },
            { label: category?.name || "Kategori", to: `/kategori/${product.categorySlug}` },
            { label: product.name },
          ]} />

          <div className="product-detail">
            <div className="product-detail__media">
              <div className="product-detail__image-wrap">
                <img
                  src={withBasePath(product.image)}
                  alt={product.imageAlt}
                  onError={handleImageError}
                  fetchPriority="high"
                />
                {product.demo ? <span className="badge badge--demo">Contoh produk</span> : null}
              </div>
            </div>

            <div className="product-detail__summary">
              <Link className="product-detail__category" to={`/kategori/${product.categorySlug}`}>
                <FiTag aria-hidden="true" /> {category?.name || "Kategori"}
              </Link>
              <h1>{product.name}</h1>
              <p className="product-detail__lead">{product.summary}</p>

              <div className="product-detail__actions">
                <ShareButton title={product.name} text={product.summary} url={shareUrl} />
                {reviewedLabel ? (
                  <span className="reviewed-date"><FiCalendar aria-hidden="true" /> Ditinjau {reviewedLabel}</span>
                ) : null}
              </div>

              <div className="recommendation-box">
                <span><FiInfo aria-hidden="true" /> Mengapa direkomendasikan</span>
                <p>{product.recommendationReason}</p>
              </div>

              <div className="marketplace-panel">
                <div>
                  <h2>Cek produk di marketplace</h2>
                  <p>Harga, stok, variasi, dan promo mengikuti informasi terbaru di marketplace.</p>
                </div>

                {activeLinks.length ? (
                  <div className="marketplace-panel__links">
                    {activeLinks.map((link) => (
                      <AffiliateLinkButton key={`${link.marketplace}-${link.url}`} link={link} />
                    ))}
                  </div>
                ) : (
                  <div className="marketplace-panel__empty" role="note">
                    <FiAlertCircle aria-hidden="true" />
                    <span>Tautan marketplace belum tersedia karena katalog masih memakai data contoh.</span>
                  </div>
                )}

                <p className="affiliate-note">
                  <FiExternalLink aria-hidden="true" /> Beberapa tautan dapat berupa link affiliate. DicekOut bisa menerima komisi tanpa menambah harga yang Anda bayar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="product-info-section section section--soft">
        <div className="container product-info-grid">
          <article className="info-card info-card--positive">
            <span className="info-card__icon"><FiCheck aria-hidden="true" /></span>
            <h2>Kelebihan</h2>
            <ul>
              {product.pros.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>

          <article className="info-card info-card--attention">
            <span className="info-card__icon"><FiAlertCircle aria-hidden="true" /></span>
            <h2>Perlu diperhatikan</h2>
            <ul>
              {product.considerations.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>

          <article className="info-card info-card--fit">
            <span className="info-card__icon"><FiUserCheck aria-hidden="true" /></span>
            <h2>Cocok untuk</h2>
            <ul>
              {product.suitableFor.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>

          {(product.notSuitableFor || []).length ? (
            <article className="info-card info-card--neutral">
              <span className="info-card__icon"><FiUserX aria-hidden="true" /></span>
              <h2>Tidak cocok untuk</h2>
              <ul>
                {product.notSuitableFor.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
          ) : null}
        </div>
      </section>

      <section className="product-description-section section section--surface">
        <div className="container product-description-grid">
          <article>
            <span className="eyebrow">Tentang produk</span>
            <h2>Informasi yang perlu diketahui</h2>
            <p>{product.description}</p>
            {productCollections.length ? (
              <div className="product-collections">
                <strong>Produk ini ada di koleksi:</strong>
                <div>
                  {productCollections.map((collection) => (
                    <Link key={collection.id} to={`/koleksi/${collection.slug}`}>{collection.name}</Link>
                  ))}
                </div>
              </div>
            ) : null}

            {contentReferences.length ? (
              <div className="content-references">
                <strong><FiPlayCircle aria-hidden="true" /> Konten terkait</strong>
                <div>
                  {contentReferences.map((reference) => (
                    <a key={`${reference.platform}-${reference.safeUrl}`} href={reference.safeUrl} target="_blank" rel="noopener">
                      {reference.label}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </article>

          <aside className="transparency-card">
            <h2>Catatan transparansi</h2>
            <p>
              DicekOut tidak melakukan checkout, memproses pembayaran, atau menjamin harga dan stok.
              Transaksi berlangsung di marketplace yang Anda pilih.
            </p>
            <Link className="text-link" to="/disclosure">Pelajari disclosure affiliate</Link>
          </aside>
        </div>
      </section>

      {relatedProducts.length ? (
        <section className="section section--aqua">
          <div className="container">
            <div className="inline-heading">
              <div>
                <span className="eyebrow">Produk serupa</span>
                <h2>Rekomendasi lain di kategori {category?.name}</h2>
              </div>
              <Link className="text-link" to={`/kategori/${product.categorySlug}`}>
                Lihat kategori
              </Link>
            </div>
            <ProductGrid products={relatedProducts} />
          </div>
        </section>
      ) : null}

      <div className="product-back container">
        <Link className="text-link" to="/produk"><FiArrowLeft aria-hidden="true" /> Kembali ke semua produk</Link>
      </div>
    </>
  );
};

export default ProductDetailPage;
