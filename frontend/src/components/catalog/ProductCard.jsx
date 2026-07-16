import { Link, useLocation } from "react-router-dom";
import { FiArrowUpRight, FiCheckCircle } from "react-icons/fi";
import { getCategory, getPrimaryAffiliateLink } from "../../utils/catalog";
import { withBasePath } from "../../config/site";
import AffiliateLinkButton from "./AffiliateLinkButton";
import SaveProductButton from "./SaveProductButton";
import { getProductVisualClassNames } from "../../config/productPalettes";
import { getCatalogReturnRoute, rememberCatalogScroll } from "../../utils/catalogNavigation";

const ProductCard = ({ product, priority = false, variant = "default" }) => {
  const location = useLocation();
  const category = getCategory(product.categorySlug);
  const primaryLink = getPrimaryAffiliateLink(product);
  const detailPath = `/produk/${product.slug}`;
  const catalogVariant = variant === "catalog";
  const directMarketplaceLink = catalogVariant ? primaryLink : null;
  const homeScrollVariant = variant === "home-scroll";
  const homeCompactVariant = variant === "home-compact";
  const variantClass = catalogVariant
    ? " product-card--catalog"
    : homeCompactVariant
      ? " product-card--home-compact"
      : homeScrollVariant
        ? " product-card--home-scroll"
        : "";

  const catalogReturnTo = getCatalogReturnRoute(location);
  const detailState = catalogReturnTo ? { catalogReturnTo } : undefined;
  const rememberPosition = () => rememberCatalogScroll(catalogReturnTo);

  const handleImageError = (event) => {
    event.currentTarget.src = withBasePath("images/products/fallback.svg");
  };

  return (
    <article className={`product-card${variantClass}`}>
      <Link className="product-card__image-link" to={detailPath} state={detailState} onClick={rememberPosition} aria-label={`Lihat detail ${product.name}`}>
        <div className={`product-card__image-wrap ${getProductVisualClassNames(product)}`}>
          <img
            src={withBasePath(product.image)}
            alt={product.imageAlt}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            onError={handleImageError}
          />
          <div className="product-card__badges">
            {product.demo ? <span className="badge badge--demo">Contoh produk</span> : null}
            {catalogVariant && product.featured ? <span className="badge badge--featured">Pilihan</span> : null}
            {catalogVariant && product.newest ? <span className="badge badge--newest">Terbaru</span> : null}
          </div>
        </div>
      </Link>
      <SaveProductButton product={product} compact />

      <div className="product-card__body">
        <Link className="product-card__category" to={`/kategori/${category?.slug || product.categorySlug}`}>
          {category?.name || "Kategori"}
        </Link>
        <h3><Link to={detailPath} state={detailState} onClick={rememberPosition}>{product.name}</Link></h3>
        <p>{product.summary}</p>
        {product.suitableFor?.[0] ? (
          <span className="product-card__fit">
            <FiCheckCircle aria-hidden="true" /> {product.suitableFor[0]}
          </span>
        ) : null}
      </div>

      <div className={`product-card__actions${directMarketplaceLink ? " product-card__actions--multiple" : ""}`}>
        <Link className="button button--secondary button--compact" to={detailPath} state={detailState} onClick={rememberPosition}>
          Lihat rekomendasi <FiArrowUpRight aria-hidden="true" />
        </Link>
        {directMarketplaceLink ? (
          <AffiliateLinkButton
            link={directMarketplaceLink}
            className="button product-card__marketplace-cta"
            compact
            context="card"
          />
        ) : null}
      </div>
    </article>
  );
};

export default ProductCard;
