import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCalendar,
  FiCheck,
  FiInfo,
  FiMoreHorizontal,
  FiTag,
  FiUserCheck,
  FiUserX,
} from "react-icons/fi";
import Seo from "../components/common/Seo";
import Breadcrumbs from "../components/common/Breadcrumbs";
import BottomSheet from "../components/common/BottomSheet";
import ShareButton from "../components/common/ShareButton";
import AffiliateLinkButton, { AffiliateDisclosureNote } from "../components/catalog/AffiliateLinkButton";
import SocialPostLinks from "../components/catalog/SocialPostLinks";
import SaveProductButton from "../components/catalog/SaveProductButton";
import StickyMarketplaceBar from "../components/catalog/StickyMarketplaceBar";
import RelatedProductSection from "../components/catalog/RelatedProductSection";
import NotFoundPage from "./NotFoundPage";
import { SITE, toAbsoluteUrl, withBasePath } from "../config/site";
import { getProductVisualClassNames } from "../config/productPalettes";
import { addRecentlyViewedProduct } from "../utils/productPreferences";
import {
  getActiveAffiliateLinks,
  getCategory,
  getCollection,
  getProduct,
  getRelatedProducts,
} from "../utils/catalog";

const ProductDetailPage = () => {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const product = getProduct(slug);
  const [marketplaceSheetOpen, setMarketplaceSheetOpen] = useState(false);

  useEffect(() => {
    if (product) addRecentlyViewedProduct(product.id);
  }, [product]);

  useEffect(() => {
    setMarketplaceSheetOpen(false);
  }, [slug]);

  const closeMarketplaceSheet = useCallback(() => setMarketplaceSheetOpen(false), []);
  const openMarketplaceSheet = useCallback(() => setMarketplaceSheetOpen(true), []);

  if (!product) return <NotFoundPage />;

  const category = getCategory(product.categorySlug);
  const relatedProducts = getRelatedProducts(product);
  const activeLinks = getActiveAffiliateLinks(product);
  const primaryLink = activeLinks[0] || null;
  const alternativeLinks = activeLinks.slice(1);
  const productCollections = (product.collectionSlugs || []).map(getCollection).filter(Boolean);
  const path = `produk/${product.slug}`;
  const shareUrl = toAbsoluteUrl(path);
  const returnTo = location.state?.catalogReturnTo || "/produk";
  const returnLabel = returnTo === "/" ? "Kembali ke beranda" : "Kembali ke daftar sebelumnya";
  const reviewedLabel = product.reviewedAt
    ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(`${product.reviewedAt}T00:00:00Z`))
    : null;

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
              <div className={`product-detail__image-wrap ${getProductVisualClassNames(product)}`}>
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
                <SaveProductButton product={product} />
                <ShareButton title={product.name} text={product.summary} url={shareUrl} />
                {reviewedLabel ? (
                  <span className="reviewed-date"><FiCalendar aria-hidden="true" /> Ditinjau {reviewedLabel}</span>
                ) : null}
              </div>

              <div className="recommendation-box">
                <span><FiInfo aria-hidden="true" /> Mengapa direkomendasikan</span>
                <p>{product.recommendationReason}</p>
              </div>

              {primaryLink ? (
                <div className="product-quick-cta">
                  <div className="product-quick-cta__copy">
                    <strong>Lanjut cek di marketplace</strong>
                    <p>Harga, stok, dan variasi mengikuti informasi terbaru di marketplace.</p>
                  </div>
                  <div className="product-quick-cta__actions">
                    <AffiliateLinkButton link={primaryLink} context="detail" />
                    {alternativeLinks.length ? (
                      <button className="text-link" type="button" onClick={openMarketplaceSheet} aria-haspopup="dialog">
                        <FiMoreHorizontal aria-hidden="true" /> Marketplace lain
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <section className="product-decision-summary" aria-labelledby="decision-summary-title">
                <div className="product-decision-summary__heading">
                  <span className="eyebrow">Ringkasan keputusan</span>
                  <h2 id="decision-summary-title">Apakah produk ini sesuai kebutuhanmu?</h2>
                </div>
                <div className="product-decision-summary__grid">
                  <article>
                    <span><FiUserCheck aria-hidden="true" /> Cocok untuk</span>
                    <ul>{product.suitableFor.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul>
                  </article>
                  <article>
                    <span><FiAlertCircle aria-hidden="true" /> Perlu diperhatikan</span>
                    <ul>{product.considerations.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul>
                  </article>
                </div>
              </section>

              <SocialPostLinks
                productName={product.name}
                productImage={product.image}
                references={product.contentReferences}
              />

              <div className="marketplace-panel">
                <div>
                  <h2>Pilih marketplace</h2>
                  <p>Gunakan marketplace utama atau pilih alternatif yang tersedia.</p>
                </div>

                {primaryLink ? (
                  <>
                    <div className="marketplace-panel__primary">
                      <AffiliateLinkButton link={primaryLink} context="detail" />
                    </div>
                    {alternativeLinks.length ? (
                      <div className="marketplace-panel__secondary">
                        <h3>Marketplace lain</h3>
                        <div className="marketplace-panel__links">
                          {alternativeLinks.map((link) => (
                            <AffiliateLinkButton
                              key={`${link.marketplace}-${link.url}`}
                              link={link}
                              context="secondary"
                              variant="secondary"
                            />
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="marketplace-panel__empty" role="note">
                    <FiAlertCircle aria-hidden="true" />
                    <span>Tautan marketplace belum tersedia karena katalog masih memakai data contoh.</span>
                  </div>
                )}

                <AffiliateDisclosureNote />
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
            <ul>{product.pros.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>

          <article className="info-card info-card--attention">
            <span className="info-card__icon"><FiAlertCircle aria-hidden="true" /></span>
            <h2>Perlu diperhatikan</h2>
            <ul>{product.considerations.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>

          <article className="info-card info-card--fit">
            <span className="info-card__icon"><FiUserCheck aria-hidden="true" /></span>
            <h2>Cocok untuk</h2>
            <ul>{product.suitableFor.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>

          {(product.notSuitableFor || []).length ? (
            <article className="info-card info-card--neutral">
              <span className="info-card__icon"><FiUserX aria-hidden="true" /></span>
              <h2>Tidak cocok untuk</h2>
              <ul>{product.notSuitableFor.map((item) => <li key={item}>{item}</li>)}</ul>
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
          </article>

          <aside className="transparency-card">
            <h2>Catatan transparansi</h2>
            <p>
              DicekOut tidak melakukan checkout, memproses pembayaran, atau menjamin harga dan stok.
              Transaksi berlangsung di marketplace yang kamu pilih.
            </p>
            <Link className="text-link" to="/disclosure">Pelajari disclosure affiliate</Link>
          </aside>
        </div>
      </section>

      {primaryLink ? (
        <section className="product-final-cta-section section section--soft">
          <div className="container product-final-cta">
            <div>
              <span className="eyebrow">Sudah cocok?</span>
              <h2>Lanjut cek produk ini di marketplace</h2>
              <p>Harga dan ketersediaan terbaru akan ditampilkan langsung oleh marketplace.</p>
            </div>
            <div className="product-final-cta__actions">
              <AffiliateLinkButton link={primaryLink} context="detail" />
              {alternativeLinks.length ? (
                <button className="button button--secondary" type="button" onClick={openMarketplaceSheet} aria-haspopup="dialog">
                  <FiMoreHorizontal aria-hidden="true" /> Marketplace lain
                </button>
              ) : null}
            </div>
            <AffiliateDisclosureNote compact />
          </div>
        </section>
      ) : null}

      <RelatedProductSection product={product} products={relatedProducts} />

      <div className="product-back container">
        <button className="text-link product-back__button" type="button" onClick={() => navigate(returnTo)}>
          <FiArrowLeft aria-hidden="true" /> {returnLabel}
        </button>
      </div>

      <StickyMarketplaceBar product={product} onOpenMore={openMarketplaceSheet} />

      <BottomSheet
        open={marketplaceSheetOpen && alternativeLinks.length > 0}
        onClose={closeMarketplaceSheet}
        title="Pilih marketplace lain"
      >
        <div className="marketplace-sheet-list">
          {alternativeLinks.map((link) => (
            <AffiliateLinkButton
              key={`${link.marketplace}-${link.url}`}
              link={link}
              context="secondary"
              variant="secondary"
            />
          ))}
        </div>
        <p className="marketplace-sheet-note">Harga, stok, variasi, dan promo mengikuti informasi terbaru di marketplace.</p>
        <AffiliateDisclosureNote compact />
      </BottomSheet>
    </>
  );
};

export default ProductDetailPage;
