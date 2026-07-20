import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import Seo from "../components/common/Seo";
import StickyMarketplaceBar from "../components/catalog/StickyMarketplaceBar";
import RelatedProductSection from "../components/catalog/RelatedProductSection";
import MarketplaceSelectionSheet from "../components/product/MarketplaceSelectionSheet.jsx";
import ProductDetailHero from "../components/product/ProductDetailHero.jsx";
import ProductFinalCta from "../components/product/ProductFinalCta.jsx";
import ProductInformationSections from "../components/product/ProductInformationSections.jsx";
import NotFoundPage from "./NotFoundPage";
import { SITE, toAbsoluteUrl } from "../config/site";
import { addRecentlyViewedProduct } from "../utils/productPreferences";
import { sanitizeCatalogReturnRoute } from "../utils/catalogNavigation";
import { formatLongDate } from "../utils/formatDate.js";
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
  const returnTo = sanitizeCatalogReturnRoute(location.state?.catalogReturnTo);
  const returnLabel = returnTo === "/" ? "Kembali ke beranda" : "Kembali ke daftar sebelumnya";
  const reviewedLabel = formatLongDate(product.reviewedAt);

  const productOgImage = product.ogImage || (!product.demo ? product.image : SITE.defaultOgImage);
  const productJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.name,
        description: product.summary,
        image: toAbsoluteUrl(productOgImage),
        url: toAbsoluteUrl(path),
        category: category?.name,
        dateModified: product.reviewedAt || product.updatedAt || undefined,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Beranda", item: toAbsoluteUrl("") },
          { "@type": "ListItem", position: 2, name: "Produk", item: toAbsoluteUrl("produk") },
          { "@type": "ListItem", position: 3, name: product.name, item: toAbsoluteUrl(path) },
        ],
      },
    ],
  };
  const affiliateDisclosureId = "product-affiliate-disclosure";
  const mobileAffiliateDisclosureId = "mobile-affiliate-disclosure";
  const sheetAffiliateDisclosureId = "marketplace-sheet-affiliate-disclosure";

  return (
    <>
      <Seo
        title={`${product.name} | DicekOut`}
        description={product.summary}
        path={path}
        image={productOgImage}
        imageAlt={product.imageAlt || product.name}
        type="product"
        noindex={product.demo || !SITE.allowIndexing}
        jsonLd={productJsonLd}
      />

      <ProductDetailHero
        product={product}
        category={category}
        shareUrl={shareUrl}
        reviewedLabel={reviewedLabel}
        primaryLink={primaryLink}
        alternativeLinks={alternativeLinks}
        onOpenMarketplaceSheet={openMarketplaceSheet}
        affiliateDisclosureId={affiliateDisclosureId}
      />

      <ProductInformationSections product={product} productCollections={productCollections} />

      <ProductFinalCta
        primaryLink={primaryLink}
        hasAlternatives={alternativeLinks.length > 0}
        onOpenMarketplaceSheet={openMarketplaceSheet}
        disclosureId={affiliateDisclosureId}
      />

      <RelatedProductSection product={product} products={relatedProducts} />

      <div className="product-back container">
        <button className="text-link product-back__button" type="button" onClick={() => navigate(returnTo)}>
          <FiArrowLeft aria-hidden="true" /> {returnLabel}
        </button>
      </div>

      <StickyMarketplaceBar
        product={product}
        onOpenMore={openMarketplaceSheet}
        disclosureId={mobileAffiliateDisclosureId}
      />

      <MarketplaceSelectionSheet
        open={marketplaceSheetOpen}
        onClose={closeMarketplaceSheet}
        links={alternativeLinks}
        disclosureId={sheetAffiliateDisclosureId}
      />
    </>
  );
};

export default ProductDetailPage;
