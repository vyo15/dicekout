import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import site from "../src/data/site.json" with { type: "json" };
import categories from "../src/data/categories.json" with { type: "json" };
import collections from "../src/data/collections.json" with { type: "json" };
import products from "../src/data/products.json" with { type: "json" };

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(frontendRoot, "dist");
const siteUrl = String(process.env.VITE_SITE_URL || `https://${site.domain}`).replace(/\/+$/, "");

const routePaths = [
  "",
  "produk",
  "kategori",
  "koleksi",
  "tersimpan",
  "tentang",
  "disclosure",
  "privacy",
  ...categories.map((item) => `kategori/${item.slug}`),
  ...collections.filter((item) => item.status === "published").map((item) => `koleksi/${item.slug}`),
  ...products.filter((item) => item.status === "published").map((item) => `produk/${item.slug}`),
];

const routeFile = (route) => route
  ? path.join(distDir, ...route.split("/"), "index.html")
  : path.join(distDir, "index.html");

const assertIncludes = (content, expected, label) => {
  if (!content.includes(expected)) throw new Error(`${label} tidak ditemukan: ${expected}`);
};

for (const route of routePaths) {
  const filePath = routeFile(route);
  await access(filePath);
  const html = await readFile(filePath, "utf8");
  const canonical = route ? `${siteUrl}/${route}` : `${siteUrl}/`;
  assertIncludes(html, `<link rel="canonical" href="${canonical}" />`, `Canonical ${route || "home"}`);
  assertIncludes(html, '<meta property="og:site_name" content="DicekOut" />', `OG site name ${route || "home"}`);
  assertIncludes(html, '<meta property="og:image:alt"', `OG image alt ${route || "home"}`);
  if (!site.allowIndexing) assertIncludes(html, '<meta name="robots" content="noindex,follow" />', `Robots ${route || "home"}`);
}

const publishedProduct = products.find((item) => item.status === "published");
if (publishedProduct) {
  const html = await readFile(routeFile(`produk/${publishedProduct.slug}`), "utf8");
  const match = html.match(/<script id="dicekout-jsonld" type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  if (!match) throw new Error("Structured data produk tidak ditemukan.");
  const jsonLd = JSON.parse(match[1]);
  const serialized = JSON.stringify(jsonLd);
  assertIncludes(serialized, '"@type":"Product"', "Product structured data");
  for (const forbidden of ['"offers"', '"aggregateRating"', '"review"']) {
    if (serialized.includes(forbidden)) throw new Error(`Structured data tidak boleh membuat field palsu ${forbidden}.`);
  }
}

const notFound = await readFile(path.join(distDir, "404.html"), "utf8");
assertIncludes(notFound, '<meta name="robots" content="noindex,follow" />', "Robots 404");

const robots = await readFile(path.join(distDir, "robots.txt"), "utf8");
const sitemap = await readFile(path.join(distDir, "sitemap.xml"), "utf8");
if (site.allowIndexing) {
  assertIncludes(robots, "Allow: /", "robots allow");
  assertIncludes(robots, "Sitemap:", "robots sitemap");
} else {
  assertIncludes(robots, "Disallow: /", "robots demo guard");
  if (/<url>/.test(sitemap)) throw new Error("Sitemap mode demo tidak boleh memuat URL indexable.");
}

console.log(`Static output valid: ${routePaths.length} route, 404, robots, sitemap, metadata, dan structured data.`);
