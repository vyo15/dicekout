import { FiExternalLink } from "react-icons/fi";
import { getSafeExternalUrl } from "../../utils/urls";

const AffiliateLinkButton = ({ link, className = "button button--primary", compact = false }) => {
  const safeUrl = getSafeExternalUrl(link?.url);
  if (!safeUrl) return null;

  return (
    <a
      className={`${className}${compact ? " button--compact" : ""}`}
      href={safeUrl}
      target="_blank"
      rel="noopener sponsored nofollow"
      aria-label={`${link.label || "Cek di marketplace"}, dibuka di tab baru`}
    >
      {link.label || `Cek di ${link.marketplace || "marketplace"}`}
      <FiExternalLink aria-hidden="true" />
    </a>
  );
};

export default AffiliateLinkButton;
