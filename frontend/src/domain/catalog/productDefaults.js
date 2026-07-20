import { DEFAULT_PRODUCT_PALETTE_ID } from "../../config/productPalettes.js";

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const createProductDefaults = () => ({
  id: "",
  slug: "",
  name: "",
  summary: "",
  description: "",
  image: "",
  imageAlt: "",
  categorySlug: "",
  collectionSlugs: [],
  recommendationReason: "",
  pros: [],
  considerations: [],
  suitableFor: [],
  notSuitableFor: [],
  keywords: [],
  aliases: [],
  featured: false,
  newest: true,
  sortOrder: 999,
  status: "draft",
  demo: false,
  updatedAt: today(),
  reviewedAt: "",
  imageSource: "",
  imageLicense: "",
  imageWidth: 0,
  imageHeight: 0,
  marketplaceProductId: "",
  affiliateDisclosureVariant: "standard",
  affiliateLinks: [],
  contentReferences: [],
  visual: {
    paletteId: DEFAULT_PRODUCT_PALETTE_ID,
    imageFit: "contain",
    imageScale: "medium",
    imagePosition: "center",
  },
});
