import { getMarketplaceCtaPresets } from "../../../../frontend/src/shared/catalogConfig.js";

export const useAffiliateLinkActions = ({ product, update }) => {
  const updateAffiliateLink = (index, patch) => {
    let next = product.affiliateLinks.map((item, position) => position === index ? { ...item, ...patch } : item);
    if (patch.isPrimary) next = next.map((item, position) => ({ ...item, isPrimary: position === index }));
    if (patch.status === "inactive" && next[index]?.isPrimary) {
      next[index] = { ...next[index], isPrimary: false };
      const replacement = next.findIndex((item, position) => position !== index && item.status !== "inactive");
      if (replacement >= 0) next[replacement] = { ...next[replacement], isPrimary: true };
    }
    update("affiliateLinks", next);
  };

  const changeAffiliateMarketplace = (index, marketplace) => {
    const link = product.affiliateLinks[index];
    const currentPresets = getMarketplaceCtaPresets(link?.marketplace);
    const keepCustomLabel = Boolean(link?.label?.trim()) && !currentPresets.includes(link.label.trim());
    updateAffiliateLink(index, {
      marketplace,
      label: keepCustomLabel ? link.label : "",
    });
  };

  const removeAffiliateLink = (index) => {
    const removedPrimary = Boolean(product.affiliateLinks[index]?.isPrimary);
    const next = product.affiliateLinks.filter((_, position) => position !== index);
    if (removedPrimary && next.length) {
      const replacement = next.findIndex((item) => item.status !== "inactive");
      if (replacement >= 0) next[replacement] = { ...next[replacement], isPrimary: true };
    }
    update("affiliateLinks", next);
  };

  return { updateAffiliateLink, changeAffiliateMarketplace, removeAffiliateLink };
};
