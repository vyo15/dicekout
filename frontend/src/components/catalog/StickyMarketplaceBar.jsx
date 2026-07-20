import { FiMoreHorizontal } from "react-icons/fi";
import { getActiveAffiliateLinks } from "../../utils/catalog";
import AffiliateLinkButton from "./AffiliateLinkButton";

const StickyMarketplaceBar = ({ product, onOpenMore, disclosureId }) => {
  const links = getActiveAffiliateLinks(product);
  const primaryLink = links[0] || null;
  const alternativeLinks = links.slice(1);

  if (!primaryLink) return null;

  return (
    <aside
      className={`sticky-marketplace-bar${alternativeLinks.length ? " sticky-marketplace-bar--multiple" : ""}`}
      aria-label="Aksi marketplace cepat"
    >
      {disclosureId ? (
        <span id={disclosureId} className="sr-only">
          Tautan marketplace dapat berupa link affiliate tanpa menambah harga yang kamu bayar.
        </span>
      ) : null}
      <AffiliateLinkButton
        link={primaryLink}
        className="button sticky-marketplace-bar__cta"
        context="sticky"
        disclosureId={disclosureId}
      />
      {alternativeLinks.length ? (
        <button
          className="button sticky-marketplace-bar__more"
          type="button"
          onClick={onOpenMore}
          aria-haspopup="dialog"
        >
          <FiMoreHorizontal aria-hidden="true" />
          <span>Marketplace lain</span>
        </button>
      ) : null}
    </aside>
  );
};

export default StickyMarketplaceBar;
