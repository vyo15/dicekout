const DEFINITIONS = [
  { id: "neutral", label: "Neutral", description: "Abu terang yang aman untuk hampir semua produk." },
  { id: "sand", label: "Sand", description: "Beige hangat untuk produk rumah dan lifestyle." },
  { id: "sage", label: "Sage", description: "Hijau lembut untuk nuansa natural dan tenang." },
  { id: "sky", label: "Sky", description: "Biru lembut untuk elektronik dan produk modern." },
  { id: "blush", label: "Blush", description: "Merah muda lembut untuk produk personal dan dekorasi." },
  { id: "lavender", label: "Lavender", description: "Ungu lembut untuk aksen premium yang ringan." },
  { id: "charcoal", label: "Charcoal", description: "Gelap kontras untuk produk berwarna terang." },
];

export const productPalettes = Object.freeze(DEFINITIONS.map((item) => Object.freeze(item)));
export const productPaletteById = new Map(productPalettes.map((item) => [item.id, item]));
export const DEFAULT_PRODUCT_PALETTE_ID = "neutral";
export const PRODUCT_IMAGE_FITS = Object.freeze(["contain"]);
export const PRODUCT_IMAGE_SCALES = Object.freeze(["small", "medium", "large"]);
export const PRODUCT_IMAGE_POSITIONS = Object.freeze(["center", "bottom", "left", "right"]);

export const getProductPalette = (id) => productPaletteById.get(String(id || "").trim()) || productPaletteById.get(DEFAULT_PRODUCT_PALETTE_ID);
export const getProductVisualClassNames = (product) => {
  const visual = product?.visual || {};
  const palette = getProductPalette(visual.paletteId);
  const scale = PRODUCT_IMAGE_SCALES.includes(visual.imageScale) ? visual.imageScale : "medium";
  const position = PRODUCT_IMAGE_POSITIONS.includes(visual.imagePosition) ? visual.imagePosition : "center";
  return `product-visual--palette-${palette.id} product-visual--scale-${scale} product-visual--position-${position}`;
};
