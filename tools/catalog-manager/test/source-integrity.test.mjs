import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const lockPath = new URL("../package-lock.json", import.meta.url);
const serverPath = new URL("../server/index.mjs", import.meta.url);

test("package lock only references the public npm registry", async () => {
  const lock = await readFile(lockPath, "utf8");
  assert.equal(lock.includes("packages.applied-caas-gateway"), false);
  assert.equal(lock.includes("https://registry.npmjs.org/"), true);
});

test("catalog server imports the file reader used by media responses", async () => {
  const source = await readFile(serverPath, "utf8");
  assert.match(source, /\{\s*readFile,\s*writeFile,\s*rm\s*\}/);
  assert.match(source, /await readFile\(file\)/);
});


test("root install prepares frontend and catalog manager dependencies", async () => {
  const rootPackagePath = new URL("../../../package.json", import.meta.url);
  const setupPath = new URL("../../../scripts/setup.mjs", import.meta.url);
  const rootPackage = JSON.parse(await readFile(rootPackagePath, "utf8"));
  const setupSource = await readFile(setupPath, "utf8");

  assert.equal(rootPackage.scripts.postinstall, "node scripts/setup.mjs");
  assert.equal(rootPackage.scripts.setup, "node scripts/setup.mjs");
  assert.match(setupSource, /\["ci", "--prefix", "frontend"\]/);
  assert.match(setupSource, /"tools\/catalog-manager"/);
  assert.match(setupSource, /--registry=https:\/\/registry\.npmjs\.org/);
});

test("catalog manager documentation uses the configured local port", async () => {
  const docsPath = new URL("../../../docs/CATALOG_MANAGER.md", import.meta.url);
  const serverSource = await readFile(serverPath, "utf8");
  const docs = await readFile(docsPath, "utf8");

  assert.match(serverSource, /const port = 666;/);
  assert.match(docs, /http:\/\/127\.0\.0\.1:666/);
  assert.equal(docs.includes("127.0.0.1:4317"), false);
});

test("catalog manager reuses the public DicekOut brand assets", async () => {
  const [app, server, html] = await Promise.all([
    readFile(new URL("../src/App.jsx", import.meta.url), "utf8"),
    readFile(new URL("../server/index.mjs", import.meta.url), "utf8"),
    readFile(new URL("../index.html", import.meta.url), "utf8")
  ]);
  assert.match(app, /brand-assets\/dicekout-logo\.png/);
  assert.match(server, /frontend["], ["]public["], ["]brand/);
  assert.match(server, /favicon-64\.png/);
  assert.match(html, /brand-assets\/favicon-64\.png/);
});


test("catalog manager uses a full-page header with DicekOut.ID branding", async () => {
  const [app, styles] = await Promise.all([
    readFile(new URL("../src/App.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8")
  ]);

  assert.match(app, /className="manager-header"/);
  assert.match(app, /DicekOut\.ID/);
  assert.match(app, /manager-brand__logo/);
  assert.match(styles, /grid-template-areas:\s*"header header"/);
  assert.match(styles, /grid-area:header/);
  assert.match(styles, /width:100%/);
});
