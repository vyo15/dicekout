import { getSafeContentUrl, getSafeExternalUrl } from "../../../frontend/src/utils/urls.js";
import { hasUnverifiedCtaClaim } from "../../../frontend/src/config/marketplaces.js";

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
  imageSource: "", imageLicense: "", imageWidth: 0, imageHeight: 0, marketplaceProductId: "",
  affiliateDisclosureVariant: "standard", affiliateLinks: [],
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


const hasText = (value) => Boolean(String(value || "").trim());
const hasItems = (value) => Array.isArray(value) && value.some((item) => hasText(item));

export const getProductReadinessChecks = ({ product, catalog, drafts = [] }) => {
  const sourceProducts = catalog?.products || [];
  const allReserved = [...sourceProducts, ...drafts];
  const sameIdentity = (item) => item?.id === product.id && item?.slug === product.slug;
  const identityUnique = hasText(product.id) && hasText(product.slug) && !allReserved.some((item) => (
    !sameIdentity(item) && (item?.id === product.id || item?.slug === product.slug)
  ));
  const categoryValid = Boolean(catalog?.categories?.some((item) => item.slug === product.categorySlug));
  const activeLinks = orderActiveAffiliateLinks(product.affiliateLinks);
  const primaryLinks = (product.affiliateLinks || []).filter((link) => link?.isPrimary);
  const affiliateLinksValid = activeLinks.length > 0 && activeLinks.every((link) => (
    Boolean(getSafeExternalUrl(link.url, link.marketplace)) && !hasUnverifiedCtaClaim(link.label)
  ));
  const contentReferencesValid = (product.contentReferences || []).every((reference) => (
    hasText(reference.label) && Boolean(getSafeContentUrl(reference.url, reference.platform))
  ));
  const publishedReal = product.status === "published" && !product.demo;
  const liveProduct = catalog?.site?.catalogMode === "live" && publishedReal;

  return [
    ["ID dan slug unik", identityUnique],
    ["Nama produk", hasText(product.name)],
    ["Ringkasan dan deskripsi", hasText(product.summary) && hasText(product.description)],
    ["Gambar dan alt text", hasText(product.image) && hasText(product.imageAlt)],
    ["Kategori valid", categoryValid],
    ["Alasan rekomendasi", hasText(product.recommendationReason)],
    ["Kelebihan dan perhatian", hasItems(product.pros) && hasItems(product.considerations)],
    ["Kesesuaian pengguna", hasItems(product.suitableFor) && (product.demo || hasItems(product.notSuitableFor))],
    ["Satu link utama yang aktif", product.demo || (primaryLinks.length === 1 && primaryLinks[0]?.status !== "inactive")],
    ["Format affiliate link valid tanpa klaim palsu", product.demo || affiliateLinksValid],
    ["Link konten sesuai platform", contentReferencesValid],
    ["Tanggal ditinjau", !publishedReal || hasText(product.reviewedAt)],
    ["Sumber dan lisensi gambar", !liveProduct || (hasText(product.imageSource) && hasText(product.imageLicense))],
    ["Resolusi gambar live", !liveProduct || (Number(product.imageWidth) >= 600 && Number(product.imageHeight) >= 600)],
    ["Disclosure affiliate", ["standard", "compact"].includes(product.affiliateDisclosureVariant || "standard")],
  ];
};
