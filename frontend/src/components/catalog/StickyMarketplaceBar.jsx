import { FiMoreHorizontal } from "react-icons/fi";
import { getActiveAffiliateLinks } from "../../utils/catalog";
import AffiliateLinkButton from "./AffiliateLinkButton";

const StickyMarketplaceBar = ({ product, onOpenMore }) => {
  const links = getActiveAffiliateLinks(product);
  const primaryLink = links[0] || null;
  const alternativeLinks = links.slice(1);

  if (!primaryLink) return null;

  return (
    <aside
      className={`sticky-marketplace-bar${alternativeLinks.length ? " sticky-marketplace-bar--multiple" : ""}`}
      aria-label="Aksi marketplace cepat"
    >
      <AffiliateLinkButton
        link={primaryLink}
        className="button sticky-marketplace-bar__cta"
        context="sticky"
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
