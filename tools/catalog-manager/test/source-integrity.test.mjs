import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const rootLockPath = new URL("../../../package-lock.json", import.meta.url);
const rootNpmrcPath = new URL("../../../.npmrc", import.meta.url);
const serverPath = new URL("../server/index.mjs", import.meta.url);

const readManagerStyles = async () => (await Promise.all([
  "base.css",
  "catalog.css",
  "layout.css",
  "theme.css",
  "workflow.css",
].map((file) => readFile(new URL(`../src/styles/${file}`, import.meta.url), "utf8")))).join("\n");

test("root dependency files only reference the public npm registry", async () => {
  const [lock, npmrc] = await Promise.all([
    readFile(rootLockPath, "utf8"),
    readFile(rootNpmrcPath, "utf8")
  ]);

  assert.equal(lock.includes("packages.applied-caas-gateway"), false);
  assert.match(npmrc, /^registry=https:\/\/registry\.npmjs\.org\/$/m);
  assert.equal(/token|password|credential/i.test(npmrc), false);
});

test("catalog server imports the file utilities used by media and lock handling", async () => {
  const source = await readFile(serverPath, "utf8");
  assert.match(source, /from "node:fs\/promises"/);
  for (const name of ["readFile", "writeFile", "rm"]) assert.match(source, new RegExp(`\\b${name}\\b`));
  assert.match(source, /await readFile\(file\)/);
  assert.match(source, /processProductImage/);
});

test("root npm workspaces install both apps without setup aliases", async () => {
  const rootPackagePath = new URL("../../../package.json", import.meta.url);
  const qualityWorkflowPath = new URL("../../../.github/workflows/quality.yml", import.meta.url);
  const deployWorkflowPath = new URL("../../../.github/workflows/deploy-pages.yml", import.meta.url);
  const rootPackage = JSON.parse(await readFile(rootPackagePath, "utf8"));
  const gitignorePath = new URL("../../../.gitignore", import.meta.url);
  const [qualityWorkflow, deployWorkflow, gitignore] = await Promise.all([
    readFile(qualityWorkflowPath, "utf8"),
    readFile(deployWorkflowPath, "utf8"),
    readFile(gitignorePath, "utf8")
  ]);

  assert.deepEqual(rootPackage.workspaces, ["frontend", "tools/catalog-manager"]);
  assert.deepEqual(rootPackage.engines, { node: "^20.19.0 || >=22.12.0", npm: ">=10.0.0" });
  assert.equal(
    rootPackage.scripts.management,
    "npm run dev --workspace dicekout-catalog-manager"
  );
  assert.equal(rootPackage.scripts.postinstall, undefined);
  assert.equal(rootPackage.scripts.setup, undefined);
  assert.deepEqual(
    Object.keys(rootPackage.scripts).filter((name) =>
      name.includes("management") || name.includes("catalog:manager")
    ),
    ["management"]
  );
  assert.match(rootPackage.scripts.check, /dicekout-catalog-manager/);
  assert.match(rootPackage.scripts.check, /npm run build --workspace dicekout-catalog-manager/);

  for (const workflow of [qualityWorkflow, deployWorkflow]) {
    assert.match(workflow, /cache-dependency-path: package-lock\.json/);
    assert.match(workflow, /run: npm ci/);
    assert.equal(workflow.includes("npm ci --prefix frontend"), false);
  }

  assert.match(gitignore, /^node_modules\/$/m);
  assert.match(gitignore, /^dist\/$/m);
  assert.equal(gitignore.includes("frontend/node_modules/"), false);
  assert.equal(gitignore.includes("tools/catalog-manager/node_modules/"), false);
  assert.equal(gitignore.includes("frontend/dist/"), false);
  assert.equal(gitignore.includes("tools/catalog-manager/dist/"), false);

  const obsoleteFiles = [
    new URL("../../../scripts/setup.mjs", import.meta.url),
    new URL("../../../frontend/package-lock.json", import.meta.url),
    new URL("../package-lock.json", import.meta.url),
    new URL("../.npmrc", import.meta.url)
  ];

  for (const file of obsoleteFiles) {
    await assert.rejects(access(file));
  }
});


test("catalog manager keeps Sharp local to the manager workspace", async () => {
  const managerPackage = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const frontendPackage = JSON.parse(await readFile(new URL("../../../frontend/package.json", import.meta.url), "utf8"));
  const processor = await readFile(new URL("../server/imageProcessor.mjs", import.meta.url), "utf8");

  assert.equal(managerPackage.dependencies.sharp, "^0.35.3");
  assert.equal(frontendPackage.dependencies?.sharp, undefined);
  assert.match(processor, /from "sharp"/);
  assert.match(processor, /\.webp\(/);
  assert.equal(processor.includes("withMetadata("), false);
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
  const [header, server, html] = await Promise.all([
    readFile(new URL("../src/components/ManagerHeader.jsx", import.meta.url), "utf8"),
    readFile(new URL("../server/index.mjs", import.meta.url), "utf8"),
    readFile(new URL("../index.html", import.meta.url), "utf8")
  ]);
  assert.match(header, /brand-assets\/dicekout-logo\.png/);
  assert.match(server, /frontend["], ["]public["], ["]brand/);
  assert.match(server, /favicon-64\.png/);
  assert.match(html, /brand-assets\/favicon-64\.png/);
});


test("catalog manager uses a full-page header with DicekOut.ID branding", async () => {
  const [header, styles] = await Promise.all([
    readFile(new URL("../src/components/ManagerHeader.jsx", import.meta.url), "utf8"),
    readManagerStyles()
  ]);

  assert.match(header, /className="manager-header"/);
  assert.match(header, /DicekOut\.ID/);
  assert.match(header, /manager-brand__logo/);
  assert.match(styles, /grid-template-areas:\s*"header header"/);
  assert.match(styles, /grid-area:header/);
  assert.match(styles, /width:100%/);
});


test("catalog manager uses React Icons and clean solid color navigation", async () => {
  const [sidebar, styles, managerPackage] = await Promise.all([
    readFile(new URL("../src/components/ManagerSidebar.jsx", import.meta.url), "utf8"),
    readManagerStyles(),
    readFile(new URL("../package.json", import.meta.url), "utf8")
  ]);

  assert.match(sidebar, /from "react-icons\/fi"/);
  assert.match(sidebar, /FiBox/);
  assert.match(sidebar, /FiFileText/);
  assert.match(sidebar, /FiCheckCircle/);
  assert.equal(sidebar.includes("<span>▦</span>"), false);
  assert.equal(sidebar.includes("<span>▣</span>"), false);
  assert.equal(sidebar.includes("<span>✓</span>"), false);

  assert.equal(styles.includes("linear-gradient("), false);
  assert.match(styles, /--manager-sidebar:var\(--surface\)/);
  assert.match(styles, /\.sidebar-nav button\.active\s*\{[\s\S]*background:\s*var\(--manager-sidebar-active\)/);

  const parsedPackage = JSON.parse(managerPackage);
  assert.equal(parsedPackage.dependencies["react-icons"], "^5.5.0");
});

test("catalog manager lint and shared utilities are wired into quality checks", async () => {
  const [rootPackage, managerPackage, managerEslint, app, apiHook, productIdentity, catalogValidator, urlUtils, affiliateActions, affiliateEditor] = await Promise.all([
    readFile(new URL("../../../package.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../package.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../eslint.config.js", import.meta.url), "utf8"),
    readFile(new URL("../src/App.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/hooks/useCatalogManagerApi.js", import.meta.url), "utf8"),
    readFile(new URL("../src/productIdentity.js", import.meta.url), "utf8"),
    readFile(new URL("../../../frontend/src/domain/catalog/validateCatalogData.js", import.meta.url), "utf8"),
    readFile(new URL("../../../frontend/src/utils/urls.js", import.meta.url), "utf8"),
    readFile(new URL("../src/hooks/useAffiliateLinkActions.js", import.meta.url), "utf8"),
    readFile(new URL("../src/components/AffiliateLinkEditor.jsx", import.meta.url), "utf8"),
  ]);

  assert.equal(managerPackage.scripts.lint, "eslint .");
  assert.match(rootPackage.scripts.lint, /dicekout-catalog-manager/);
  assert.match(rootPackage.scripts.check, /npm run lint --workspace dicekout-catalog-manager/);
  assert.match(managerEslint, /react-hooks/);
  assert.match(app, /useCatalogManagerApi/);
  assert.equal(app.includes("sessionStorage.setItem"), false);
  assert.match(apiHook, /useEffect/);
  assert.match(apiHook, /history\.replaceState/);
  assert.match(productIdentity, /slugifyProductName/);
  assert.match(catalogValidator, /security\/safeExternalUrl/);
  assert.match(catalogValidator, /verifyAffiliateLinkFormat/);
  assert.match(urlUtils, /security\/safeExternalUrl/);
  assert.match(affiliateActions, /marketplace === "tokopedia" \? "accesstrade"/);
  assert.match(affiliateEditor, /disabled=\{link\.marketplace === "tokopedia" && network\.id === "direct"\}/);
});


test("catalog editor guards draft identity and navigation workflows", async () => {
  const [app, sidebar, deleteFlow, managerPackage] = await Promise.all([
    readFile(new URL("../src/App.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/ManagerSidebar.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/hooks/useDeleteProductFlow.js", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8").then(JSON.parse),
  ]);

  assert.equal(app.includes("createUniqueProductIdentity(value, catalog?.products, drafts)"), false);
  assert.match(app, /createUniqueProductIdentity\(value, \[\.\.\.\(catalog\?\.products \|\| \[\]\), \.\.\.drafts\]\)/);
  assert.match(sidebar, /onShowProducts\("source", "draft"\)/);
  assert.equal(app.includes('onClick={() => { setListMode("source"); setStatusFilter("draft"); setView("products"); }}'), false);
  assert.match(deleteFlow, /mergeDeleteImpact/);
  assert.match(managerPackage.scripts.test, /--import tsx --test/);
  for (const dependency of ["@testing-library/react", "@testing-library/user-event", "jsdom", "tsx"]) {
    assert.ok(managerPackage.devDependencies[dependency]);
  }
});

test("repository source hygiene excludes obsolete patch instructions and defines line endings", async () => {
  const attributes = await readFile(new URL("../../../.gitattributes", import.meta.url), "utf8");
  assert.match(attributes, /^\* text=auto$/m);
  await assert.rejects(access(new URL("../../../PATCH_DELETE_FILES.txt", import.meta.url)));
});

test("catalog API and local media handlers keep server-side defense in depth", async () => {
  const [server, repository, tempMediaRepository, security] = await Promise.all([
    readFile(new URL("../server/index.mjs", import.meta.url), "utf8"),
    readFile(new URL("../server/catalogRepository.mjs", import.meta.url), "utf8"),
    readFile(new URL("../server/tempMediaRepository.mjs", import.meta.url), "utf8"),
    readFile(new URL("../server/security.mjs", import.meta.url), "utf8"),
  ]);

  const apiStart = server.indexOf("const api = async");
  const firstGetRoute = server.indexOf('url.pathname === "/api/catalog"');
  const sessionGuard = server.indexOf("assertSession(req, token)", apiStart);
  assert.ok(apiStart >= 0 && sessionGuard > apiStart && sessionGuard < firstGetRoute);
  assert.match(server, /serveAllowedFile/);
  assert.match(server, /resolveContainedPath\(root, name\)/);
  assert.match(repository, /verifyTempMedia: tempMediaRepository\.verifyTempMedia/);
  assert.match(tempMediaRepository, /assertSafeBasename\(tempMedia\.tempName/);
  assert.match(tempMediaRepository, /assertSafeBasename\(tempMedia\.finalName/);
  assert.match(repository, /removeTemp: tempMediaRepository\.removeTempIfUnreferenced/);
  assert.match(security, /realpath\(current\)/);
});
