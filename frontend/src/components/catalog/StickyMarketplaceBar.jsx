import AffiliateLinkButton from "./AffiliateLinkButton";
import SaveProductButton from "./SaveProductButton";

const StickyMarketplaceBar = ({ product, links = [] }) => {
  if (!links.length) return null;

  const visibleLinks = links.slice(0, 2);

  return (
    <aside className="sticky-marketplace-bar" aria-label="Aksi marketplace cepat">
      <div className="sticky-marketplace-bar__links">
        {visibleLinks.map((link) => (
          <AffiliateLinkButton
            key={`${link.marketplace}-${link.url}`}
            link={link}
            className="button sticky-marketplace-bar__cta"
            compact
          />
        ))}
      </div>
      <SaveProductButton product={product} compact />
    </aside>
  );
};

export default StickyMarketplaceBar;
