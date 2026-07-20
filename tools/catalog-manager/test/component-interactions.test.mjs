import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body><button id='return-focus'>Pemicu</button><div id='root'></div></body></html>", {
  url: "http://127.0.0.1:666/",
  pretendToBeVisual: true,
});

for (const key of [
  "window",
  "document",
  "navigator",
  "HTMLElement",
  "Node",
  "MutationObserver",
  "getComputedStyle",
  "Event",
  "KeyboardEvent",
  "MouseEvent",
]) {
  Object.defineProperty(globalThis, key, {
    value: dom.window[key],
    configurable: true,
    writable: true,
  });
}
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const React = await import("react");
globalThis.React = React;
const { cleanup, render, screen } = await import("@testing-library/react");
const userEvent = (await import("@testing-library/user-event")).default;
const { DeleteProductDialog } = await import("../src/components/DeleteProductDialog.jsx");
const { mergeDeleteImpact } = await import("../src/components/deleteDialogState.js");
const { EditorTabs } = await import("../src/components/editor/EditorTabs.jsx");
const { AffiliateLinkEditor } = await import("../src/components/AffiliateLinkEditor.jsx");

afterEach(() => {
  cleanup();
  globalThis.document.body.innerHTML = "<button id='return-focus'>Pemicu</button><div id='root'></div>";
});

const sourceDialog = (overrides = {}) => ({
  kind: "source",
  requestId: 7,
  item: {
    id: "prod-target",
    slug: "produk-target",
    name: "Produk Target",
    image: "images/products/target.webp",
    visual: { paletteId: "neutral" },
  },
  typedName: "",
  confirmed: false,
  loading: false,
  impact: {
    fingerprint: "fingerprint",
    product: {
      id: "prod-target",
      slug: "produk-target",
      name: "Produk Target",
      affiliateLinks: 1,
      contentReferences: 0,
      imageProtected: false,
      imageShared: false,
      imageUsers: 0,
    },
    collections: [],
    drafts: [],
  },
  ...overrides,
});

test("hard delete stays disabled until exact name and checkbox confirmation are both satisfied", async () => {
  const user = userEvent.setup({ document: globalThis.document });
  let confirmCount = 0;

  function Harness() {
    const [dialog, setDialog] = React.useState(sourceDialog());
    return React.createElement(DeleteProductDialog, {
      dialog,
      busy: false,
      onClose: () => {},
      onConfirm: () => { confirmCount += 1; },
      onTypedNameChange: (typedName) => setDialog((current) => ({ ...current, typedName })),
      onConfirmedChange: (confirmed) => setDialog((current) => ({ ...current, confirmed })),
      productImageUrl: () => "/catalog-media/target.webp",
    });
  }

  render(React.createElement(Harness));
  const deleteButton = screen.getByRole("button", { name: "Hapus produk" });
  const nameInput = screen.getByLabelText("Ketik nama produk: Produk Target");
  const confirmation = screen.getByRole("checkbox", { name: /Saya memahami/ });

  assert.equal(deleteButton.disabled, true);
  await user.type(nameInput, "Produk Target");
  assert.equal(deleteButton.disabled, true);
  await user.click(confirmation);
  assert.equal(deleteButton.disabled, false);
  await user.click(deleteButton);
  assert.equal(confirmCount, 1);
});

test("busy state disables destructive confirmation and modal restores focus when closed", async () => {
  const trigger = globalThis.document.getElementById("return-focus");
  trigger.focus();
  const user = userEvent.setup({ document: globalThis.document });
  let closed = false;

  render(React.createElement(DeleteProductDialog, {
    dialog: sourceDialog({ typedName: "Produk Target", confirmed: true }),
    busy: true,
    onClose: () => { closed = true; },
    onConfirm: () => {},
    onTypedNameChange: () => {},
    onConfirmedChange: () => {},
    productImageUrl: () => "/catalog-media/target.webp",
  }));

  assert.equal(screen.getByRole("button", { name: "Hapus produk" }).disabled, true);
  await user.keyboard("{Escape}");
  assert.equal(closed, false, "busy dialog must ignore close requests supplied by the parent guard");

  cleanup();
  assert.equal(globalThis.document.activeElement, trigger);
});

test("stale delete-impact responses cannot replace the active dialog target", () => {
  const current = sourceDialog({ requestId: 9, item: { ...sourceDialog().item, id: "prod-new" } });
  const staleImpact = sourceDialog().impact;
  assert.equal(mergeDeleteImpact(current, 8, "prod-target", staleImpact), current);

  const currentImpact = { ...staleImpact, product: { ...staleImpact.product, id: "prod-new", name: "Produk Baru" } };
  const merged = mergeDeleteImpact(current, 9, "prod-new", currentImpact);
  assert.equal(merged.loading, false);
  assert.equal(merged.impact.product.name, "Produk Baru");
});

test("editor tabs expose tab semantics and support arrow-key navigation", async () => {
  const user = userEvent.setup({ document: globalThis.document });

  function Harness() {
    const [activeTab, setActiveTab] = React.useState("general");
    return React.createElement(EditorTabs, { activeTab, onChange: setActiveTab });
  }

  render(React.createElement(Harness));
  const general = screen.getByRole("tab", { name: "Informasi utama" });
  general.focus();
  await user.keyboard("{ArrowRight}");
  await new Promise((resolve) => globalThis.window.requestAnimationFrame(resolve));

  const content = screen.getByRole("tab", { name: "Rekomendasi" });
  assert.equal(content.getAttribute("aria-selected"), "true");
  assert.equal(globalThis.document.activeElement, content);
});

test("field markup labels controls without nesting interactive labels", () => {
  const affiliateUrl = "https://s.shopee.co.id/9fJO0rHK9y";
  render(React.createElement(AffiliateLinkEditor, {
    links: [{ marketplace: "shopee", label: "", url: affiliateUrl, status: "active", isPrimary: true }],
    marketplaces: [{ id: "shopee", label: "Shopee" }],
    onMarketplaceChange: () => {},
    onLinkChange: () => {},
    onRemove: () => {},
    onAdd: () => {},
  }));

  assert.ok(screen.getByLabelText("Marketplace"));
  assert.ok(screen.getByLabelText("Label tombol"));
  const previewLink = screen.getByRole("link", { name: "Periksa link" });
  assert.equal(previewLink.getAttribute("href"), affiliateUrl);
  assert.match(screen.getByRole("status").textContent, /short link affiliate resmi Shopee/i);
  assert.equal(globalThis.document.querySelector("label label"), null);
});

test("affiliate preview link is hidden when the URL host does not match its marketplace", () => {
  render(React.createElement(AffiliateLinkEditor, {
    links: [{ marketplace: "shopee", label: "", url: "https://example.com/product?affiliate_id=kept", status: "active", isPrimary: true }],
    marketplaces: [{ id: "shopee", label: "Shopee" }],
    onMarketplaceChange: () => {},
    onLinkChange: () => {},
    onRemove: () => {},
    onAdd: () => {},
  }));

  assert.equal(screen.queryByRole("link", { name: "Periksa link" }), null);
});


test("plain Shopee product URL shows an affiliate-format error and cannot be previewed", () => {
  render(React.createElement(AffiliateLinkEditor, {
    links: [{ marketplace: "shopee", label: "", url: "https://shopee.co.id/product/123/456?affiliate_id=made-up", status: "active", isPrimary: true }],
    marketplaces: [{ id: "shopee", label: "Shopee" }],
    onMarketplaceChange: () => {},
    onLinkChange: () => {},
    onRemove: () => {},
    onAdd: () => {},
  }));

  assert.equal(screen.queryByRole("link", { name: "Periksa link" }), null);
  assert.match(screen.getByRole("alert").textContent, /tidak membuktikan attribution affiliate/i);
  assert.equal(screen.getByLabelText("URL affiliate asli").getAttribute("aria-invalid"), "true");
});
