import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stylesDir = path.join(root, "src", "styles");

const styleFiles = [
  "base.css",
  "home-foundation.css",
  "catalog-cards.css",
  "catalog-controls.css",
  "product-detail.css",
  "legal.css",
  "layout-responsive.css",
  "home.css",
  "catalog.css",
  "overlays.css",
  "theme-overrides.css",
  "product-enhancements.css",
  "feedback.css",
];

test("frontend styles use explicit feature files and do not restore the monolithic stylesheet", async () => {
  await assert.rejects(access(path.join(stylesDir, "site.css")));
  const main = await readFile(path.join(root, "src", "main.jsx"), "utf8");
  let lastIndex = -1;
  for (const file of styleFiles) {
    const index = main.indexOf(`./styles/${file}`);
    assert.ok(index > lastIndex, `${file} harus diimport dalam urutan cascade yang disepakati.`);
    lastIndex = index;
  }
});

test("retired hero selectors do not return to the active stylesheet", async () => {
  const css = (await Promise.all(styleFiles.map((file) => readFile(path.join(stylesDir, file), "utf8")))).join("\n");
  for (const retiredClass of [
    "hero-section__inner",
    "hero-copy",
    "hero-points",
    "hero-showcase",
    "showcase-window",
    "showcase-mini-card",
    "showcase-mini-logo",
    "floating-shape",
    "decorative-ring",
    "decorative-sphere",
    "decorative-capsule",
  ]) {
    assert.equal(css.includes(`.${retiredClass}`), false, `${retiredClass} adalah selector hero lama.`);
  }
});
