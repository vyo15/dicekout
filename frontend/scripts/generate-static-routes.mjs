import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");
const dataDir = path.join(rootDir, "src", "data");

const readJson = async (name) => JSON.parse(await readFile(path.join(dataDir, name), "utf8"));
const [site, categories, collections, products, indexTemplate] = await Promise.all([
  readJson("site.json"),
  readJson("categories.json"),
  readJson("collections.json"),
  readJson("products.json"),
  readFile(path.join(distDir, "index.html"), "utf8"),
]);

const siteUrl = String(process.env.VITE_SITE_URL || `https://${site.domain}`).replace(/\/+$/, "");
const robots = site.allowIndexing ? "index,follow" : "noindex,nofollow";
const defaultImage = absolute(site.defaultOgImage);

function absolute(route = "") {
  const base = `${siteUrl}/`;
  return new URL(String(route).replace(/^\/+/, ""), base).toString();
}

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const replaceMeta = (html, selectorRegex, replacement) => (
  selectorRegex.test(html) ? html.replace(selectorRegex, replacement) : html.replace("</head>", `  ${replacement}\n  </head>`)
);

const applyMeta = (html, meta) => {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description || site.description);
  const url = escapeHtml(absolute(meta.path));
  const image = escapeHtml(absolute(meta.image || site.defaultOgImage));
  const pageRobots = meta.noindex ? "noindex,nofollow" : robots;

  let output = html.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
  output = replaceMeta(output, /<meta\s+name="description"\s+content="[^"]*"\s*\/>/i, `<meta name="description" content="${description}" />`);
  output = replaceMeta(output, /<meta\s+name="robots"\s+content="[^"]*"\s*\/>/i, `<meta name="robots" content="${pageRobots}" />`);
  output = output.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/i, `<link rel="canonical" href="${url}" />`);
  output = replaceMeta(output, /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/i, `<meta property="og:title" content="${title}" />`);
  output = replaceMeta(output, /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/i, `<meta property="og:description" content="${description}" />`);
  output = replaceMeta(output, /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/i, `<meta property="og:url" content="${url}" />`);
  output = replaceMeta(output, /<meta\s+property="og:image"\s+content="[^"]*"\s*\/>/i, `<meta property="og:image" content="${image}" />`);
  output = replaceMeta(output, /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/i, `<meta name="twitter:title" content="${title}" />`);
  output = replaceMeta(output, /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/i, `<meta name="twitter:description" content="${description}" />`);
  output = replaceMeta(output, /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/>/i, `<meta name="twitter:image" content="${image}" />`);
  return output;
};

const routes = [
  { path: "", title: site.title, description: site.description },
  { path: "produk", title: "Semua Produk Rekomendasi | DicekOut", description: "Jelajahi seluruh produk rekomendasi DicekOut berdasarkan nama, kategori, dan koleksi konten." },
  { path: "tentang", title: "Tentang DicekOut | Cara Kami Memilih Produk", description: "Pelajari tujuan DicekOut dan prinsip yang digunakan dalam menyusun rekomendasi produk." },
  { path: "disclosure", title: "Disclosure Affiliate | DicekOut", description: "Penjelasan transparan tentang cara kerja tautan affiliate di DicekOut." },
  { path: "privacy", title: "Kebijakan Privasi | DicekOut", description: "Informasi tentang data yang digunakan oleh versi statis DicekOut dan tautan menuju marketplace eksternal." },
  ...categories.map((category) => ({
    path: `kategori/${category.slug}`,
    title: `${category.name} | Rekomendasi DicekOut`,
    description: `${category.description} Jelajahi produk pilihan dalam kategori ${category.name}.`,
  })),
  ...collections.filter((item) => item.status === "published").map((collection) => ({
    path: `koleksi/${collection.slug}`,
    title: `${collection.name} | Koleksi DicekOut`,
    description: collection.description,
    noindex: Boolean(collection.demo),
  })),
  ...products.filter((item) => item.status === "published").map((product) => ({
    path: `produk/${product.slug}`,
    title: `${product.name} | DicekOut`,
    description: product.summary,
    noindex: Boolean(product.demo),
  })),
];

for (const route of routes) {
  const html = applyMeta(indexTemplate, route);
  if (!route.path) {
    await writeFile(path.join(distDir, "index.html"), html);
    continue;
  }
  const routeDir = path.join(distDir, ...route.path.split("/"));
  await mkdir(routeDir, { recursive: true });
  await writeFile(path.join(routeDir, "index.html"), html);
}

const notFoundHtml = applyMeta(indexTemplate, {
  path: "404",
  title: "Halaman Tidak Ditemukan | DicekOut",
  description: "Halaman yang Anda cari tidak ditemukan di DicekOut.",
  noindex: true,
});
await writeFile(path.join(distDir, "404.html"), notFoundHtml);

const sitemapRoutes = site.allowIndexing
  ? routes.filter((route) => !route.noindex).map((route) => `  <url><loc>${escapeHtml(absolute(route.path))}</loc></url>`).join("\n")
  : "";
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapRoutes}\n</urlset>\n`;
await writeFile(path.join(distDir, "sitemap.xml"), sitemap);

const robotsContent = site.allowIndexing
  ? `User-agent: *\nAllow: /\nSitemap: ${absolute("sitemap.xml")}\n`
  : "User-agent: *\nDisallow: /\n";
await writeFile(path.join(distDir, "robots.txt"), robotsContent);

console.log(`Static routes generated: ${routes.length} routes. Default OG image: ${defaultImage}`);
