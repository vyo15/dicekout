import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stylesRoot = path.join(root, "src");
const tokenFile = path.join(root, "src", "styles", "tokens.css");
const manifestFile = path.join(root, "public", "site.webmanifest");
const indexFile = path.join(root, "index.html");
const themeFile = path.join(root, "src", "utils", "theme.js");
const logoFile = path.join(root, "public", "brand", "dicekout-logo.png");

const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const absolute = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(absolute) : [absolute];
});

const cssFiles = walk(stylesRoot).filter((file) => file.endsWith(".css"));
const componentCssFiles = cssFiles.filter((file) => file !== tokenFile);
const colorLiteralPattern = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g;
const definitionPattern = /(--[a-z0-9-]+)\s*:/gi;
const usagePattern = /var\((--[a-z0-9-]+)/gi;
const errors = [];

for (const file of componentCssFiles) {
  const source = fs.readFileSync(file, "utf8");
  const literals = [...source.matchAll(colorLiteralPattern)].map((match) => match[0]);
  if (literals.length) {
    errors.push(`${path.relative(root, file)} masih memiliki warna hard-coded: ${[...new Set(literals)].join(", ")}`);
  }
}

const allCss = cssFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n");
const definitions = new Set([...allCss.matchAll(definitionPattern)].map((match) => match[1]));
const runtimeSources = walk(path.join(root, "src"))
  .filter((file) => /\.(?:js|jsx)$/.test(file))
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n");
for (const match of runtimeSources.matchAll(/["'](--[a-z0-9-]+)["']\s*:/gi)) definitions.add(match[1]);
const usages = new Set([...allCss.matchAll(usagePattern)].map((match) => match[1]));
for (const token of usages) {
  if (!definitions.has(token)) errors.push(`Token dipakai tetapi tidak didefinisikan: ${token}`);
}

const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
const indexHtml = fs.readFileSync(indexFile, "utf8");
const themeSource = fs.readFileSync(themeFile, "utf8");
const expected = { light: "#f4f4f4", dark: "#090a0c", manifest: "#111111" };

if (!themeSource.includes(`light: "${expected.light}"`) || !themeSource.includes(`dark: "${expected.dark}"`)) {
  errors.push("BROWSER_THEME_COLORS di theme.js tidak sinkron dengan warna browser yang disetujui.");
}
if (!indexHtml.includes(`content="${expected.light}"`) || !indexHtml.includes(`"${expected.dark}" : "${expected.light}"`)) {
  errors.push("Theme bootstrap di index.html tidak sinkron dengan theme.js.");
}
if (manifest.background_color !== expected.light || manifest.theme_color !== expected.manifest) {
  errors.push("site.webmanifest tidak sinkron dengan warna light theme/browser.");
}
if (!fs.existsSync(logoFile)) errors.push("Asset logo utama tidak ditemukan: public/brand/dicekout-logo.png");

if (errors.length) {
  console.error("Validasi theme token gagal:\n- " + errors.join("\n- "));
  process.exit(1);
}

console.log(`Validasi theme token berhasil (${cssFiles.length} file CSS, ${definitions.size} token terdefinisi).`);
