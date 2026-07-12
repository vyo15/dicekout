import siteData from "../data/site.json";

const normalizeBasePath = (value = "/") => {
  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  if (withLeadingSlash === "/") return "/";
  return withLeadingSlash.replace(/\/+$/, "");
};

const normalizeSiteUrl = (value) => String(value || siteData.domain || "").replace(/\/+$/, "");

export const BASE_PATH = normalizeBasePath(import.meta.env.BASE_URL || "/");
export const SITE_URL = normalizeSiteUrl(import.meta.env.VITE_SITE_URL || `https://${siteData.domain}`);
export const SITE = Object.freeze(siteData);

export const withBasePath = (path = "") => {
  const cleanPath = String(path).replace(/^\/+/, "");
  const viteBase = import.meta.env.BASE_URL || "/";
  return `${viteBase}${cleanPath}`.replace(/([^:]\/)\/+/g, "$1");
};

export const toAbsoluteUrl = (path = "") => {
  const cleanPath = String(path).replace(/^\/+/, "");
  const base = SITE_URL.endsWith("/") ? SITE_URL : `${SITE_URL}/`;
  return new URL(cleanPath, base).toString();
};
