import { useState } from "react";
import { FiCheck, FiShare2 } from "react-icons/fi";

const ShareButton = ({ title, text, url, className = "button button--secondary" }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = url || window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: shareUrl });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      if (error?.name !== "AbortError") {
        setCopied(false);
      }
    }
  };

  return (
    <button className={className} type="button" onClick={handleShare}>
      {copied ? <FiCheck aria-hidden="true" /> : <FiShare2 aria-hidden="true" />}
      {copied ? "Link tersalin" : "Bagikan"}
    </button>
  );
};

export default ShareButton;
