import site from "../src/data/site.json" with { type: "json" };

const normalizeBasePath = (value = "/") => {
  const withLeadingSlash = String(value || "/").startsWith("/") ? String(value || "/") : `/${value}`;
  return withLeadingSlash === "/" ? "/" : `${withLeadingSlash.replace(/\/+$/, "")}/`;
};

const basePath = normalizeBasePath(process.env.VITE_BASE_PATH || "/");
const siteUrl = new URL(String(process.env.VITE_SITE_URL || `https://${site.domain}`).trim());

if (!new Set(["http:", "https:"]).has(siteUrl.protocol) || siteUrl.username || siteUrl.password) {
  throw new Error("VITE_SITE_URL harus URL HTTP(S) tanpa credential.");
}

const expectedBasePath = normalizeBasePath(siteUrl.pathname || "/");
if (basePath !== expectedBasePath) {
  throw new Error(
    `Konfigurasi deployment tidak sinkron: VITE_BASE_PATH=${basePath} tetapi path VITE_SITE_URL=${expectedBasePath}. `
    + "Gunakan path repository untuk github.io atau '/' untuk custom domain.",
  );
}

if (site.allowIndexing && siteUrl.protocol !== "https:") {
  throw new Error("Website yang dapat diindeks wajib memakai VITE_SITE_URL HTTPS.");
}

console.log(`Konfigurasi deployment valid: ${siteUrl.toString().replace(/\/+$/, "")}${basePath === "/" ? "" : ` (base ${basePath})`}`);
