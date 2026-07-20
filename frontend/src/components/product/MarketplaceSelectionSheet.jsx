import BottomSheet from "../common/BottomSheet";
import AffiliateLinkButton, { AffiliateDisclosureNote } from "../catalog/AffiliateLinkButton";

const MarketplaceSelectionSheet = ({ open, onClose, links, disclosureId }) => (
  <BottomSheet open={open && links.length > 0} onClose={onClose} title="Pilih marketplace lain">
    <div className="marketplace-sheet-list">
      {links.map((link) => (
        <AffiliateLinkButton
          key={`${link.marketplace}-${link.url}`}
          link={link}
          context="secondary"
          variant="secondary"
          disclosureId={disclosureId}
        />
      ))}
    </div>
    <p className="marketplace-sheet-note">Harga, stok, variasi, dan promo mengikuti informasi terbaru di marketplace.</p>
    <AffiliateDisclosureNote compact id={disclosureId} />
  </BottomSheet>
);

export default MarketplaceSelectionSheet;
