import { FiExternalLink } from "react-icons/fi";
import { getMarketplace } from "../../config/marketplaces";
import { getSafeExternalUrl } from "../../utils/urls";

const AffiliateLinkButton = ({ link, className = "button button--primary", compact = false }) => {
  const marketplace = getMarketplace(link?.marketplace);
  const safeUrl = getSafeExternalUrl(link?.url, link?.marketplace);
  if (!safeUrl || !marketplace) return null;

  const label = link.label?.trim() || marketplace.defaultCta;

  return (
    <a
      className={`${className}${compact ? " button--compact" : ""}`}
      href={safeUrl}
      target="_blank"
      rel="noopener sponsored nofollow"
      aria-label={`${label}, dibuka di tab baru`}
    >
      {label}
      <FiExternalLink aria-hidden="true" />
    </a>
  );
};

export default AffiliateLinkButton;
