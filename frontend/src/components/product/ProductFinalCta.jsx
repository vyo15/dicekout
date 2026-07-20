import { FiMoreHorizontal } from "react-icons/fi";
import AffiliateLinkButton, { AffiliateDisclosureNote } from "../catalog/AffiliateLinkButton";

const ProductFinalCta = ({ primaryLink, hasAlternatives, onOpenMarketplaceSheet, disclosureId }) => {
  if (!primaryLink) return null;

  return (
    <section className="product-final-cta-section section section--soft">
      <div className="container product-final-cta">
        <div>
          <span className="eyebrow">Sudah cocok?</span>
          <h2>Lanjut cek produk ini di marketplace</h2>
          <p>Harga dan ketersediaan terbaru akan ditampilkan langsung oleh marketplace.</p>
        </div>
        <div className="product-final-cta__actions">
          <AffiliateLinkButton link={primaryLink} context="detail" disclosureId={disclosureId} />
          {hasAlternatives ? (
            <button className="button button--secondary" type="button" onClick={onOpenMarketplaceSheet} aria-haspopup="dialog">
              <FiMoreHorizontal aria-hidden="true" /> Marketplace lain
            </button>
          ) : null}
        </div>
        <AffiliateDisclosureNote compact />
      </div>
    </section>
  );
};

export default ProductFinalCta;
