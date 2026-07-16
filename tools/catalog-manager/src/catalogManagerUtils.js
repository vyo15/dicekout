import { parseSafeExternalUrl } from "../../../frontend/src/domain/security/safeExternalUrl.js";

export const lines = (value) => String(value || "").split("\n").map((item) => item.trim()).filter(Boolean);
export const today = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
export const clone = (value) => structuredClone(value);

export const formatBytes = (value) => {
  const bytes = Number(value) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 102.4) / 10} KB`;
  return `${Math.round(bytes / 1024 / 102.4) / 10} MB`;
};

export const formatDateTime = (value) => {
  if (!value) return "Waktu tidak tersedia";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
};

export const safeHttpUrl = (value) => parseSafeExternalUrl(value)?.original || "";

export const orderActiveAffiliateLinks = (links = []) => links
  .map((link, index) => ({ link, index }))
  .filter(({ link }) => Boolean(link) && link.status !== "inactive")
  .sort((a, b) => Number(Boolean(b.link.isPrimary)) - Number(Boolean(a.link.isPrimary)) || a.index - b.index)
  .map(({ link }) => link);

export const blankProduct = () => ({
  id: "", slug: "", name: "", summary: "", description: "", image: "", imageAlt: "",
  categorySlug: "", collectionSlugs: [], recommendationReason: "", pros: [], considerations: [],
  suitableFor: [], notSuitableFor: [], keywords: [], aliases: [], featured: false, newest: true,
  sortOrder: 999, status: "draft", demo: false, updatedAt: today(), reviewedAt: "",
  imageSource: "", imageLicense: "", imageWidth: 0, imageHeight: 0, affiliateLinks: [],
  contentReferences: [], visual: { paletteId: "neutral", imageFit: "contain", imageScale: "medium", imagePosition: "center" },
});

export const editorTabs = [
  ["general", "Informasi utama"],
  ["content", "Rekomendasi"],
  ["links", "Link & konten"],
  ["publish", "Publikasi"],
];

export const backupLabels = {
  "apply-product": "Penerapan produk",
  "delete-product": "Penghapusan produk",
  "pre-rollback": "Pengaman sebelum pemulihan",
  legacy: "Backup lama",
  invalid: "Backup tidak valid",
};
