import crypto from "node:crypto";
import sharp from "sharp";
import { slugifyProductName } from "../../../frontend/src/domain/catalog/normalizeProduct.js";

export const MAX_IMAGE_INPUT_BYTES = 25 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 50_000_000;
const TARGET_OUTPUT_BYTES = 600 * 1024;
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);
const MIME_BY_FORMAT = {
  jpeg: new Set(["image/jpeg", "image/jpg"]),
  png: new Set(["image/png"]),
  webp: new Set(["image/webp"]),
};
const PROFILES = [
  { maxSize: 1200, quality: 84 },
  { maxSize: 1200, quality: 80 },
  { maxSize: 1080, quality: 78 },
  { maxSize: 960, quality: 76 },
  { maxSize: 800, quality: 74 },
];

const percentSaved = (before, after) => before > 0
  ? Math.max(0, Math.round((1 - (after / before)) * 1000) / 10)
  : 0;

export const processProductImage = async ({ buffer, suppliedMime = "", slug = "", name = "", originalName = "" }) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw new Error("Gambar wajib diisi.");
  if (buffer.length > MAX_IMAGE_INPUT_BYTES) throw new Error("Ukuran gambar melewati batas keamanan 25 MB.");

  let metadata;
  try {
    metadata = await sharp(buffer, { failOn: "error", limitInputPixels: MAX_IMAGE_PIXELS }).metadata();
  } catch {
    throw new Error("File tidak dapat diproses sebagai gambar yang valid.");
  }

  if (!ALLOWED_FORMATS.has(metadata.format)) throw new Error("Gunakan gambar JPG, PNG, atau WebP yang valid.");
  if (!metadata.width || !metadata.height) throw new Error("Dimensi gambar tidak dapat dibaca.");
  if (metadata.width * metadata.height > MAX_IMAGE_PIXELS) throw new Error("Resolusi gambar terlalu besar untuk diproses dengan aman.");
  if ((metadata.pages || 1) > 1) throw new Error("Gambar animasi belum didukung. Gunakan gambar statis.");

  const normalizedMime = String(suppliedMime || "").toLowerCase().split(";")[0].trim();
  if (normalizedMime && normalizedMime !== "application/octet-stream" && !MIME_BY_FORMAT[metadata.format]?.has(normalizedMime)) {
    throw new Error("Tipe file tidak cocok dengan isi gambar.");
  }

  let output = null;
  let selectedProfile = PROFILES.at(-1);
  for (const profile of PROFILES) {
    const candidate = await sharp(buffer, { failOn: "error", limitInputPixels: MAX_IMAGE_PIXELS })
      .rotate()
      .toColourspace("srgb")
      .resize({
        width: profile.maxSize,
        height: profile.maxSize,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: profile.quality,
        alphaQuality: 90,
        effort: 4,
        smartSubsample: true,
      })
      .toBuffer();

    output = candidate;
    selectedProfile = profile;
    if (candidate.length <= TARGET_OUTPUT_BYTES) break;
  }

  const optimizedMetadata = await sharp(output, { failOn: "error" }).metadata();
  const hash = crypto.createHash("sha256").update(output).digest("hex");
  const safeSlug = slugifyProductName(slug || name) || "product-image";
  const finalName = `${safeSlug}-${hash.slice(0, 12)}.webp`;

  return {
    buffer: output,
    finalName,
    hash,
    path: `images/products/${finalName}`,
    original: {
      name: String(originalName || ""),
      format: metadata.format === "jpeg" ? "JPEG" : metadata.format.toUpperCase(),
      width: metadata.width,
      height: metadata.height,
      size: buffer.length,
    },
    optimized: {
      format: "WebP",
      width: optimizedMetadata.width || 0,
      height: optimizedMetadata.height || 0,
      size: output.length,
      quality: selectedProfile.quality,
      maxSize: selectedProfile.maxSize,
      savedPercent: percentSaved(buffer.length, output.length),
      hasAlpha: Boolean(optimizedMetadata.hasAlpha),
    },
  };
};
