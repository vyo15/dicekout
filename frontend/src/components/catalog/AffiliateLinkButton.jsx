import { FiExternalLink } from "react-icons/fi";
import {
  getAffiliateCtaLabel,
  getMarketplace,
} from "../../config/marketplaces";
import { getSafeExternalUrl } from "../../utils/urls";

export const AffiliateDisclosureNote = ({ compact = false, className = "" }) => (
  <p className={`affiliate-disclosure-note${compact ? " affiliate-disclosure-note--compact" : ""}${className ? ` ${className}` : ""}`}>
    <FiExternalLink aria-hidden="true" />
    <span>Tautan marketplace dapat berupa link affiliate tanpa menambah harga yang kamu bayar.</span>
  </p>
);

const AffiliateLinkButton = ({
  link,
  className = "",
  compact = false,
  context = "detail",
  variant = "primary",
}) => {
  const marketplace = getMarketplace(link?.marketplace);
  const safeUrl = getSafeExternalUrl(link?.url, link?.marketplace);
  if (!safeUrl || !marketplace) return null;

  const label = getAffiliateCtaLabel(link, context);
  const resolvedClassName = [
    className || `button ${variant === "secondary" ? "button--secondary" : "button--primary"}`,
    "affiliate-link-button",
    `affiliate-link-button--${variant}`,
    `affiliate-link-button--${context}`,
    compact ? "button--compact" : "",
  ].filter(Boolean).join(" ");

  return (
    <a
      className={resolvedClassName}
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
