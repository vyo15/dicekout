import { getMarketplace, hostnameMatchesMarketplace } from "../config/marketplaces.js";
import { getContentPlatform, hostnameMatchesContentPlatform } from "../config/contentPlatforms.js";
import {
  parseSafeExternalUrl,
  parseSecureExternalUrl,
} from "../domain/security/safeExternalUrl.js";

export {
  parseSafeExternalUrl,
  parseSecureExternalUrl,
} from "../domain/security/safeExternalUrl.js";

const SHOPEE_SHORT_HOSTS = new Set(["s.shopee.co.id", "shope.ee"]);
const SHOPEE_DESTINATION_HOSTS = new Set(["shopee.co.id", "www.shopee.co.id"]);
const SHOPEE_SHORT_TOKEN_PATTERN = /^\/[A-Za-z0-9_-]{5,128}\/?$/;
const SAFE_AFFILIATE_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const SHOPEE_ATTRIBUTION_SOURCE_PATTERN = /^an_[A-Za-z0-9_-]+$/i;
const hasControlCharacters = (value) => [...String(value || "")].some((character) => {
  const code = character.charCodeAt(0);
  return code < 32 || code === 127;
});

const invalidAffiliateUrl = (code, message, details = {}) => ({
  valid: false,
  code,
  message,
  warning: "",
  original: null,
  parsed: null,
  kind: "invalid",
  ...details,
});

const validAffiliateUrl = ({ original, parsed }, details) => ({
  valid: true,
  code: "valid",
  original,
  parsed,
  ...details,
});

const hasExactlyOneParam = (params, name) => params.getAll(name).length === 1;
const hasAtMostOneParam = (params, name) => params.getAll(name).length <= 1;
const hasNonEmptyParam = (params, name) => Boolean(String(params.get(name) || "").trim());

const validateShopeeWrapper = (result) => {
  const { parsed } = result;
  const params = parsed.searchParams;

  if (!hasExactlyOneParam(params, "origin_link")) {
    return invalidAffiliateUrl(
      "shopee-wrapper-origin",
      "Wrapper Shopee wajib memiliki tepat satu parameter origin_link.",
      result,
    );
  }
  if (!hasExactlyOneParam(params, "affiliate_id")) {
    return invalidAffiliateUrl(
      "shopee-wrapper-affiliate-id",
      "Wrapper Shopee wajib memiliki tepat satu affiliate_id dari akun affiliate Anda.",
      result,
    );
  }
  if (!hasAtMostOneParam(params, "sub_id")) {
    return invalidAffiliateUrl(
      "shopee-wrapper-sub-id",
      "Wrapper Shopee tidak boleh memiliki parameter sub_id duplikat.",
      result,
    );
  }

  const affiliateId = String(params.get("affiliate_id") || "").trim();
  if (!SAFE_AFFILIATE_ID_PATTERN.test(affiliateId)) {
    return invalidAffiliateUrl(
      "shopee-wrapper-affiliate-id",
      "affiliate_id Shopee kosong atau memiliki format yang tidak aman.",
      result,
    );
  }

  const subId = params.get("sub_id");
  if (subId !== null && (!String(subId).trim() || hasControlCharacters(subId))) {
    return invalidAffiliateUrl(
      "shopee-wrapper-sub-id",
      "sub_id Shopee kosong atau memiliki karakter kontrol yang tidak aman.",
      result,
    );
  }

  const origin = parseSecureExternalUrl(params.get("origin_link"));
  if (!origin) {
    return invalidAffiliateUrl(
      "shopee-wrapper-origin",
      "origin_link Shopee wajib berupa URL HTTPS tanpa username atau password.",
      result,
    );
  }
  if (!SHOPEE_DESTINATION_HOSTS.has(origin.parsed.hostname.toLowerCase())) {
    return invalidAffiliateUrl(
      "shopee-wrapper-origin-host",
      "origin_link pada wrapper Shopee wajib menuju shopee.co.id.",
      result,
    );
  }

  return validAffiliateUrl(result, {
    kind: "shopee-wrapper",
    message: "Format wrapper affiliate resmi Shopee dikenali.",
    warning: "Kepemilikan affiliate_id dan pencatatan komisi tetap harus dicek melalui akun Shopee Affiliate Anda.",
  });
};

const validateShopeeDirectAttributedUrl = (result) => {
  const params = result.parsed.searchParams;
  const criticalParams = ["utm_medium", "utm_source", "uls_trackid", "utm_term"];
  if (!criticalParams.every((name) => hasExactlyOneParam(params, name) && hasNonEmptyParam(params, name))) {
    return invalidAffiliateUrl(
      "shopee-direct-attribution",
      "URL produk Shopee biasa tidak membuktikan attribution affiliate. Gunakan short link atau wrapper resmi dari Shopee Affiliate.",
      result,
    );
  }

  const medium = String(params.get("utm_medium") || "").toLowerCase();
  const source = String(params.get("utm_source") || "");
  if (medium !== "affiliates" || !SHOPEE_ATTRIBUTION_SOURCE_PATTERN.test(source)) {
    return invalidAffiliateUrl(
      "shopee-direct-attribution",
      "Parameter attribution pada URL Shopee tidak sesuai format hasil redirect affiliate resmi.",
      result,
    );
  }

  return validAffiliateUrl(result, {
    kind: "shopee-attributed-destination",
    message: "Format URL tujuan dengan attribution affiliate Shopee dikenali.",
    warning: "Lebih aman menyimpan short link atau wrapper asli dari dashboard; kepemilikan attribution tetap harus dicek di Laporan Performa.",
  });
};

const validateShopeeAffiliateUrl = (result) => {
  const hostname = result.parsed.hostname.toLowerCase();

  if (SHOPEE_SHORT_HOSTS.has(hostname)) {
    if (result.parsed.pathname === "/an_redir") return validateShopeeWrapper(result);
    if (
      !SHOPEE_SHORT_TOKEN_PATTERN.test(result.parsed.pathname)
      || result.parsed.search
      || result.parsed.hash
    ) {
      return invalidAffiliateUrl(
        "shopee-short-link",
        "Short link Shopee harus berupa satu token resmi tanpa query atau fragment tambahan.",
        result,
      );
    }

    return validAffiliateUrl(result, {
      kind: "shopee-short-link",
      message: "Format short link affiliate resmi Shopee dikenali.",
      warning: "Token tidak dapat dibuktikan milik akun Anda dari source code. Pastikan link dibuat dari akun Shopee Affiliate Anda dan cek klik di Laporan Performa.",
    });
  }

  if (SHOPEE_DESTINATION_HOSTS.has(hostname)) return validateShopeeDirectAttributedUrl(result);

  return invalidAffiliateUrl(
    "shopee-host",
    "Hostname tersebut bukan host affiliate Shopee yang diizinkan.",
    result,
  );
};

export const validateAffiliateUrl = (value, marketplaceId = "other") => {
  const original = String(value || "").trim();
  if (!original) return invalidAffiliateUrl("empty", "URL affiliate wajib diisi.");

  const marketplace = getMarketplace(marketplaceId);
  if (!marketplace) {
    return invalidAffiliateUrl("unknown-marketplace", `Marketplace tidak terdaftar: ${marketplaceId}.`);
  }

  const safeResult = parseSafeExternalUrl(original);
  if (!safeResult) {
    return invalidAffiliateUrl(
      "unsafe-url",
      "URL tidak valid, memakai protokol berbahaya, atau berisi username/password.",
    );
  }
  const secureResult = parseSecureExternalUrl(original);
  if (!secureResult) {
    return invalidAffiliateUrl(
      "https-required",
      "URL affiliate wajib memakai HTTPS.",
      safeResult,
    );
  }
  if (!hostnameMatchesMarketplace(secureResult.parsed.hostname, marketplace)) {
    return invalidAffiliateUrl(
      "marketplace-host-mismatch",
      `Hostname URL tidak cocok dengan marketplace ${marketplace.label}.`,
      secureResult,
    );
  }

  if (marketplace.affiliateValidation === "shopee-strict") {
    return validateShopeeAffiliateUrl(secureResult);
  }

  return validAffiliateUrl(secureResult, {
    kind: "marketplace-host-only",
    message: `URL HTTPS aman dan hostname sesuai registry ${marketplace.label}.`,
    warning: `Format affiliate ${marketplace.label} belum diaudit khusus. Pastikan URL dibuat melalui program affiliate resmi marketplace tersebut.`,
  });
};

export const getSafeExternalUrl = (value, marketplaceId = "other") => {
  const validation = validateAffiliateUrl(value, marketplaceId);
  return validation.valid ? validation.original : null;
};

export const getSafeContentUrl = (value, platformId) => {
  const result = parseSafeExternalUrl(value);
  if (!result) return null;

  const platform = getContentPlatform(platformId);
  if (!platform || !hostnameMatchesContentPlatform(result.parsed.hostname, platform)) return null;

  // Preserve the original post URL exactly; only validate protocol, credentials, and host.
  return result.original;
};
