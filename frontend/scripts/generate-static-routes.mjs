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

const configuredSiteUrl = String(process.env.VITE_SITE_URL || `https://${site.domain}`).trim();
const parsedSiteUrl = new URL(configuredSiteUrl);
if (!new Set(["http:", "https:"]).has(parsedSiteUrl.protocol) || parsedSiteUrl.username || parsedSiteUrl.password) {
  throw new Error("VITE_SITE_URL harus URL HTTP(S) tanpa credential.");
}
const siteUrl = parsedSiteUrl.toString().replace(/\/+$/, "");
const robots = site.allowIndexing ? "index,follow" : "noindex,follow";

function absolute(route = "") {
  return new URL(String(route).replace(/^\/+/, ""), `${siteUrl}/`).toString();
}

const defaultImage = absolute(site.defaultOgImage);

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const safeJson = (value) => JSON.stringify(value).replaceAll("<", "\\u003c");

const replaceMeta = (html, selectorRegex, replacement) => (
  selectorRegex.test(html) ? html.replace(selectorRegex, replacement) : html.replace("</head>", `  ${replacement}\n  </head>`)
);

const replaceJsonLd = (html, jsonLd) => {
  const existing = /<script\s+id="dicekout-jsonld"\s+type="application\/ld\+json">[\s\S]*?<\/script>/i;
  if (!jsonLd) return html.replace(existing, "");
  const script = `<script id="dicekout-jsonld" type="application/ld+json">${safeJson(jsonLd)}</script>`;
  return existing.test(html) ? html.replace(existing, script) : html.replace("</head>", `  ${script}\n  </head>`);
};

const applyMeta = (html, meta) => {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description || site.description);
  const url = escapeHtml(absolute(meta.path));
  const image = escapeHtml(absolute(meta.image || site.defaultOgImage));
  const imageAlt = escapeHtml(meta.imageAlt || meta.title || site.brandName);
  const pageRobots = meta.noindex ? "noindex,follow" : robots;
  const type = escapeHtml(meta.type || "website");

  let output = html.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
  output = replaceMeta(output, /<meta\s+name="description"\s+content="[^"]*"\s*\/>/i, `<meta name="description" content="${description}" />`);
  output = replaceMeta(output, /<meta\s+name="robots"\s+content="[^"]*"\s*\/>/i, `<meta name="robots" content="${pageRobots}" />`);
  output = output.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/i, `<link rel="canonical" href="${url}" />`);
  output = replaceMeta(output, /<meta\s+property="og:type"\s+content="[^"]*"\s*\/>/i, `<meta property="og:type" content="${type}" />`);
  output = replaceMeta(output, /<meta\s+property="og:site_name"\s+content="[^"]*"\s*\/>/i, `<meta property="og:site_name" content="${escapeHtml(site.brandName)}" />`);
  output = replaceMeta(output, /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/i, `<meta property="og:title" content="${title}" />`);
  output = replaceMeta(output, /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/i, `<meta property="og:description" content="${description}" />`);
  output = replaceMeta(output, /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/i, `<meta property="og:url" content="${url}" />`);
  output = replaceMeta(output, /<meta\s+property="og:image"\s+content="[^"]*"\s*\/>/i, `<meta property="og:image" content="${image}" />`);
  output = replaceMeta(output, /<meta\s+property="og:image:alt"\s+content="[^"]*"\s*\/>/i, `<meta property="og:image:alt" content="${imageAlt}" />`);
  output = replaceMeta(output, /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/i, `<meta name="twitter:title" content="${title}" />`);
  output = replaceMeta(output, /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/i, `<meta name="twitter:description" content="${description}" />`);
  output = replaceMeta(output, /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/>/i, `<meta name="twitter:image" content="${image}" />`);
  output = replaceMeta(output, /<meta\s+name="twitter:image:alt"\s+content="[^"]*"\s*\/>/i, `<meta name="twitter:image:alt" content="${imageAlt}" />`);
  if (site.searchConsoleVerification) {
    output = replaceMeta(output, /<meta\s+name="google-site-verification"\s+content="[^"]*"\s*\/>/i, `<meta name="google-site-verification" content="${escapeHtml(site.searchConsoleVerification)}" />`);
  }
  return replaceJsonLd(output, meta.jsonLd);
};

const breadcrumbJsonLd = (items) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: absolute(item.path),
  })),
});

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: site.brandName,
      url: absolute(""),
      description: site.description,
      potentialAction: {
        "@type": "SearchAction",
        target: `${absolute("produk")}?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      name: site.brandName,
      url: absolute(""),
      logo: absolute("brand/icon-512.png"),
    },
  ],
};

const routes = [
  {
    path: "",
    title: site.title,
    description: site.description,
    imageAlt: "DicekOut, katalog rekomendasi produk pilihan",
    lastmod: site.updatedAt,
    jsonLd: websiteJsonLd,
  },
  {
    path: "produk",
    title: "Semua Produk Rekomendasi | DicekOut",
    description: "Jelajahi seluruh produk rekomendasi DicekOut berdasarkan nama, kategori, dan koleksi konten.",
    lastmod: site.updatedAt,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "CollectionPage", name: "Semua Produk Rekomendasi", url: absolute("produk"), description: "Katalog produk rekomendasi DicekOut." },
        breadcrumbJsonLd([{ name: "Beranda", path: "" }, { name: "Semua Produk", path: "produk" }]),
      ],
    },
  },
  {
    path: "kategori",
    title: "Kategori Produk | DicekOut",
    description: "Jelajahi rekomendasi produk DicekOut berdasarkan kategori.",
    lastmod: site.updatedAt,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "CollectionPage", name: "Kategori Produk", url: absolute("kategori") },
        breadcrumbJsonLd([{ name: "Beranda", path: "" }, { name: "Kategori", path: "kategori" }]),
      ],
    },
  },
  {
    path: "koleksi",
    title: "Koleksi Rekomendasi | DicekOut",
    description: "Jelajahi koleksi rekomendasi DicekOut berdasarkan kebutuhan dan konteks penggunaan.",
    lastmod: site.updatedAt,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "CollectionPage", name: "Koleksi Rekomendasi", url: absolute("koleksi") },
        breadcrumbJsonLd([{ name: "Beranda", path: "" }, { name: "Koleksi", path: "koleksi" }]),
      ],
    },
  },
  { path: "tersimpan", title: "Produk Tersimpan | DicekOut", description: "Produk DicekOut yang tersimpan pada perangkat ini.", noindex: true },
  { path: "tentang", title: "Tentang DicekOut | Cara Kami Memilih Produk", description: "Pelajari tujuan DicekOut dan prinsip yang digunakan dalam menyusun rekomendasi produk." },
  { path: "disclosure", title: "Disclosure Affiliate | DicekOut", description: "Penjelasan transparan tentang cara kerja tautan affiliate di DicekOut." },
  { path: "privacy", title: "Kebijakan Privasi | DicekOut", description: "Informasi tentang data yang digunakan oleh versi statis DicekOut dan tautan menuju marketplace eksternal." },
  ...categories.map((category) => ({
    path: `kategori/${category.slug}`,
    title: `${category.name} | Rekomendasi DicekOut`,
    description: `${category.description} Jelajahi produk pilihan dalam kategori ${category.name}.`,
    lastmod: site.updatedAt,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "CollectionPage", name: category.name, url: absolute(`kategori/${category.slug}`), description: category.description },
        breadcrumbJsonLd([{ name: "Beranda", path: "" }, { name: "Kategori", path: "kategori" }, { name: category.name, path: `kategori/${category.slug}` }]),
      ],
    },
  })),
  ...collections.filter((item) => item.status === "published").map((collection) => ({
    path: `koleksi/${collection.slug}`,
    title: `${collection.name} | Koleksi DicekOut`,
    description: collection.description,
    noindex: Boolean(collection.demo),
    lastmod: collection.updatedAt || site.updatedAt,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "CollectionPage", name: collection.name, url: absolute(`koleksi/${collection.slug}`), description: collection.description },
        breadcrumbJsonLd([{ name: "Beranda", path: "" }, { name: "Koleksi", path: "koleksi" }, { name: collection.name, path: `koleksi/${collection.slug}` }]),
      ],
    },
  })),
  ...products.filter((item) => item.status === "published").map((product) => {
    const routePath = `produk/${product.slug}`;
    const productImage = product.ogImage || (!product.demo ? product.image : site.defaultOgImage);
    const category = categories.find((item) => item.slug === product.categorySlug);
    return {
      path: routePath,
      title: `${product.name} | DicekOut`,
      description: product.summary,
      image: productImage,
      imageAlt: product.imageAlt || product.name,
      type: "product",
      noindex: Boolean(product.demo),
      lastmod: product.reviewedAt || product.updatedAt || site.updatedAt,
      jsonLd: {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Product",
            name: product.name,
            description: product.summary,
            image: absolute(productImage),
            url: absolute(routePath),
            category: category?.name,
            dateModified: product.reviewedAt || product.updatedAt || undefined,
          },
          breadcrumbJsonLd([
            { name: "Beranda", path: "" },
            { name: "Produk", path: "produk" },
            { name: product.name, path: routePath },
          ]),
        ],
      },
    };
  }),
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
  ? routes.filter((route) => !route.noindex).map((route) => {
    const lastmod = route.lastmod ? `<lastmod>${escapeHtml(route.lastmod)}</lastmod>` : "";
    return `  <url><loc>${escapeHtml(absolute(route.path))}</loc>${lastmod}</url>`;
  }).join("\n")
  : "";
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapRoutes}\n</urlset>\n`;
await writeFile(path.join(distDir, "sitemap.xml"), sitemap);

const robotsContent = site.allowIndexing
  ? `User-agent: *\nAllow: /\nSitemap: ${absolute("sitemap.xml")}\n`
  : "User-agent: *\nDisallow: /\n";
await writeFile(path.join(distDir, "robots.txt"), robotsContent);

console.log(`Static routes generated: ${routes.length} routes. Default OG image: ${defaultImage}`);
