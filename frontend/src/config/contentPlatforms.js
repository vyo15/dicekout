const CONTENT_PLATFORM_DEFINITIONS = [
  {
    id: "instagram",
    label: "Instagram",
    aliases: ["ig"],
    hostnames: ["instagram.com", "www.instagram.com"],
  },
  {
    id: "tiktok",
    label: "TikTok",
    aliases: ["tik-tok", "tik tok"],
    hostnames: ["tiktok.com", "www.tiktok.com", "vt.tiktok.com"],
  },
  {
    id: "youtube",
    label: "YouTube",
    aliases: ["youtube-shorts", "youtu"],
    hostnames: ["youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com"],
  },
  {
    id: "facebook",
    label: "Facebook",
    aliases: ["fb"],
    hostnames: ["facebook.com", "www.facebook.com", "fb.watch", "m.facebook.com"],
  },
];

export const contentPlatforms = Object.freeze(
  CONTENT_PLATFORM_DEFINITIONS.map((item) => Object.freeze({
    ...item,
    aliases: Object.freeze([...item.aliases]),
    hostnames: Object.freeze([...item.hostnames]),
  })),
);

const platformByAlias = new Map();
for (const platform of contentPlatforms) {
  platformByAlias.set(platform.id, platform);
  for (const alias of platform.aliases) platformByAlias.set(alias, platform);
}

export const normalizeContentPlatformId = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return platformByAlias.get(normalized)?.id || normalized;
};

export const getContentPlatform = (value) => platformByAlias.get(
  String(value || "").trim().toLowerCase(),
) || null;

export const hostnameMatchesContentPlatform = (hostname, platform) => {
  if (!platform) return false;
  const normalized = String(hostname || "").trim().toLowerCase().replace(/^www\./, "");
  return platform.hostnames.some((allowed) => {
    const allowedNormalized = allowed.toLowerCase().replace(/^www\./, "");
    return normalized === allowedNormalized || normalized.endsWith(`.${allowedNormalized}`);
  });
};
