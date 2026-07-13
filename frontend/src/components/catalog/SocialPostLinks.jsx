import { useMemo, useState } from "react";
import {
  FiChevronRight,
  FiExternalLink,
  FiLink,
  FiPlay,
} from "react-icons/fi";
import {
  SiFacebook,
  SiInstagram,
  SiTiktok,
  SiYoutube,
} from "react-icons/si";
import BottomSheet from "../common/BottomSheet";
import { withBasePath } from "../../config/site";
import { getSafeExternalUrl } from "../../utils/urls";

const PLATFORM_ALIASES = {
  fb: "facebook",
  facebook: "facebook",
  ig: "instagram",
  instagram: "instagram",
  "tik-tok": "tiktok",
  "tik tok": "tiktok",
  tiktok: "tiktok",
  youtube: "youtube",
  "youtube-shorts": "youtube",
  youtu: "youtube",
};

const PLATFORM_CONFIG = {
  facebook: {
    label: "Facebook",
    className: "facebook",
    Icon: SiFacebook,
  },
  instagram: {
    label: "Instagram",
    className: "instagram",
    Icon: SiInstagram,
  },
  tiktok: {
    label: "TikTok",
    className: "tiktok",
    Icon: SiTiktok,
  },
  youtube: {
    label: "YouTube",
    className: "youtube",
    Icon: SiYoutube,
  },
};

const normalizePlatform = (platform) => {
  const normalized = String(platform || "").trim().toLowerCase();
  return PLATFORM_ALIASES[normalized] || normalized || "other";
};

const getPlatformConfig = (platform) => {
  const normalizedPlatform = normalizePlatform(platform);
  return {
    platform: normalizedPlatform,
    ...(PLATFORM_CONFIG[normalizedPlatform] || {
      label: String(platform || "Konten").trim() || "Konten",
      className: "other",
      Icon: FiLink,
    }),
  };
};

const PlatformLogo = ({ platform, size = "small" }) => {
  const config = getPlatformConfig(platform);

  if (config.platform === "tiktok") {
    return (
      <span
        className={`social-platform-logo social-platform-logo--${config.className} social-platform-logo--${size}`}
        aria-hidden="true"
      >
        <SiTiktok className="social-platform-logo__tiktok social-platform-logo__tiktok--cyan" />
        <SiTiktok className="social-platform-logo__tiktok social-platform-logo__tiktok--pink" />
        <SiTiktok className="social-platform-logo__tiktok social-platform-logo__tiktok--main" />
      </span>
    );
  }

  const Icon = config.Icon;
  return (
    <span
      className={`social-platform-logo social-platform-logo--${config.className} social-platform-logo--${size}`}
      aria-hidden="true"
    >
      <Icon />
    </span>
  );
};

const SocialPostLinks = ({ productName, productImage, references = [] }) => {
  const [open, setOpen] = useState(false);

  const safeReferences = useMemo(() => references.map((reference, index) => {
    const safeUrl = getSafeExternalUrl(reference?.url);
    if (!safeUrl) return null;

    const config = getPlatformConfig(reference?.platform);
    return {
      ...reference,
      id: `${config.platform}-${safeUrl}-${index}`,
      safeUrl,
      platform: config.platform,
      platformLabel: config.label,
    };
  }).filter(Boolean), [references]);

  const visiblePlatforms = useMemo(() => {
    const uniquePlatforms = new Map();
    safeReferences.forEach((reference) => {
      if (!uniquePlatforms.has(reference.platform)) {
        uniquePlatforms.set(reference.platform, reference);
      }
    });
    return Array.from(uniquePlatforms.values());
  }, [safeReferences]);

  if (!safeReferences.length) return null;

  const imageSrc = withBasePath(productImage);
  const fallbackImage = withBasePath("images/products/fallback.svg");
  const optionLayout = safeReferences.length > 4 ? " social-post-links__options--scroll" : "";

  return (
    <div className="social-post-links">
      <button
        className="social-post-links__trigger"
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Lihat konten ${productName} di media sosial`}
      >
        <span className="social-post-links__thumbnail" aria-hidden="true">
          <img
            src={imageSrc}
            alt=""
            onError={(event) => {
              event.currentTarget.src = fallbackImage;
            }}
          />
          <span className="social-post-links__play"><FiPlay /></span>
        </span>

        <span className="social-post-links__copy">
          <strong>Lihat video produk</strong>
          <small>Pilih platform untuk membuka konten</small>
        </span>

        <span className="social-post-links__platforms" aria-hidden="true">
          {visiblePlatforms.slice(0, 4).map((reference) => (
            <PlatformLogo key={reference.platform} platform={reference.platform} />
          ))}
          {visiblePlatforms.length > 4 ? (
            <span className="social-post-links__more">+{visiblePlatforms.length - 4}</span>
          ) : null}
        </span>

        <FiChevronRight className="social-post-links__chevron" aria-hidden="true" />
      </button>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Tonton konten produk"
        variant="responsive-modal"
      >
        <div className="social-post-links__dialog">
          <div className="social-post-links__dialog-intro">
            <span className="social-post-links__dialog-thumbnail" aria-hidden="true">
              <img
                src={imageSrc}
                alt=""
                onError={(event) => {
                  event.currentTarget.src = fallbackImage;
                }}
              />
              <span className="social-post-links__play"><FiPlay /></span>
            </span>
            <div>
              <strong>{productName}</strong>
              <p>Pilih platform. Konten akan dibuka di media sosial aslinya.</p>
            </div>
          </div>

          <div className={`social-post-links__options${optionLayout}`} aria-label="Pilihan platform konten">
            {safeReferences.map((reference) => (
              <a
                className="social-post-links__option"
                key={reference.id}
                href={reference.safeUrl}
                target="_blank"
                rel="noopener"
                onClick={() => setOpen(false)}
                aria-label={`Buka ${reference.label || `konten ${productName}`} di ${reference.platformLabel}`}
                title={reference.label || `Buka di ${reference.platformLabel}`}
              >
                <FiExternalLink className="social-post-links__external" aria-hidden="true" />
                <PlatformLogo platform={reference.platform} size="large" />
                <strong>{reference.platformLabel}</strong>
                {reference.label ? <span className="sr-only">{reference.label}</span> : null}
              </a>
            ))}
          </div>

          <p className="social-post-links__note">
            Video tidak dimuat di DicekOut agar halaman tetap ringan. Setiap pilihan membuka postingan pada platform asal.
          </p>
        </div>
      </BottomSheet>
    </div>
  );
};

export default SocialPostLinks;
