import { Link } from "react-router-dom";
import { FiAlertCircle, FiCalendar, FiInfo, FiMoreHorizontal, FiTag, FiUserCheck } from "react-icons/fi";
import Breadcrumbs from "../common/Breadcrumbs";
import ShareButton from "../common/ShareButton";
import AffiliateLinkButton, { AffiliateDisclosureNote } from "../catalog/AffiliateLinkButton";
import SocialPostLinks from "../catalog/SocialPostLinks";
import SaveProductButton from "../catalog/SaveProductButton";
import { getProductVisualClassNames } from "../../config/productPalettes";
import { withBasePath } from "../../config/site";

const ProductDetailHero = ({
  product,
  category,
  shareUrl,
  reviewedLabel,
  primaryLink,
  alternativeLinks,
  onOpenMarketplaceSheet,
  affiliateDisclosureId,
}) => {
  const handleImageError = (event) => {
    event.currentTarget.src = withBasePath("images/products/fallback.svg");
  };

  return (
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
                  <AffiliateLinkButton link={primaryLink} context="detail" disclosureId={affiliateDisclosureId} />
                  {alternativeLinks.length ? (
                    <button className="text-link" type="button" onClick={onOpenMarketplaceSheet} aria-haspopup="dialog">
                      <FiMoreHorizontal aria-hidden="true" /> Marketplace lain
                    </button>
                  ) : null}
                </div>
                <AffiliateDisclosureNote compact id={affiliateDisclosureId} />
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

            {alternativeLinks.length || !primaryLink ? (
              <div className="marketplace-panel">
                <div>
                  <h2>{primaryLink ? "Marketplace lain" : "Marketplace belum tersedia"}</h2>
                  <p>{primaryLink
                    ? "Pilih alternatif marketplace yang tersedia untuk produk ini."
                    : "Tautan marketplace belum tersedia untuk produk ini."}</p>
                </div>

                {alternativeLinks.length ? (
                  <div className="marketplace-panel__links">
                    {alternativeLinks.map((link) => (
                      <AffiliateLinkButton
                        key={`${link.marketplace}-${link.url}`}
                        link={link}
                        context="secondary"
                        variant="secondary"
                        disclosureId={affiliateDisclosureId}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="marketplace-panel__empty" role="note">
                    <FiAlertCircle aria-hidden="true" />
                    <span>Coba kembali setelah tautan produk selesai ditinjau oleh DicekOut.</span>
                  </div>
                )}

                {!primaryLink ? <AffiliateDisclosureNote /> : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductDetailHero;
