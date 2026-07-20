import crypto from "node:crypto";
import path from "node:path";
import { access } from "node:fs/promises";

export const DRAFT_VERSION = 1;
export const BACKUP_VERSION = 2;
export const MIN_SUPPORTED_BACKUP_VERSION = 1;
export const DELETE_BACKUP_RETENTION = 5;
export const TEMP_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const TEMP_MAX_FILES = 20;
export const PRODUCT_MEDIA_PREFIX = "images/products/";
export const PROTECTED_PRODUCT_MEDIA = new Set(["fallback.svg"]);

export const exists = async (file) => access(file).then(() => true).catch(() => false);
export const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
export const timestamp = () => new Date().toISOString().replace(/[:.]/g, "-");
export const safeOperationToken = (value) => String(value || "operation")
  .toLowerCase()
  .replace(/[^a-z0-9-]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 72) || "operation";
export const clone = (value) => structuredClone(value);
export const relativeProductMediaName = (imagePath) => {
  const value = String(imagePath || "");
  if (!value.startsWith(PRODUCT_MEDIA_PREFIX)) return null;
  const name = value.slice(PRODUCT_MEDIA_PREFIX.length);
  return name && name === path.basename(name) ? name : null;
};
