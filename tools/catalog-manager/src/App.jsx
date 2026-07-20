import { useCallback, useEffect, useState } from "react";
import { createUniqueProductIdentity } from "./productIdentity.js";
import { ProductLibrary } from "./components/ProductLibrary.jsx";
import { BackupHistory } from "./components/BackupHistory.jsx";
import { ManagerHeader } from "./components/ManagerHeader.jsx";
import { ManagerSidebar } from "./components/ManagerSidebar.jsx";
import { ProductEditorView } from "./components/editor/ProductEditorView.jsx";
import { DeleteProductDialog } from "./components/DeleteProductDialog.jsx";
import { RollbackDialog } from "./components/RollbackDialog.jsx";
import { useCatalogManagerApi } from "./hooks/useCatalogManagerApi.js";
import { useAffiliateLinkActions } from "./hooks/useAffiliateLinkActions.js";
import { useCatalogEditorOperations } from "./hooks/useCatalogEditorOperations.js";
import { useCatalogListState } from "./hooks/useCatalogListState.js";
import { useDeleteProductFlow } from "./hooks/useDeleteProductFlow.js";
import { useOperationLock } from "./hooks/useOperationLock.js";
import { useProductEditorState } from "./hooks/useProductEditorState.js";
import { useUnsavedChangesGuard } from "./hooks/useUnsavedChangesGuard.js";
import {
  blankProduct,
  clone,
  getProductReadinessChecks,
  orderActiveAffiliateLinks,
  today,
} from "./catalogManagerUtils.js";

export default function App() {
  const { api } = useCatalogManagerApi();

  const [catalog, setCatalog] = useState(null);
  const [options, setOptions] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [backups, setBackups] = useState([]);
  const {
    product, setProduct, mode, setMode, activeTab, setActiveTab,
    tempMedia, setTempMedia, previewUrl, setPreviewUrl,
    previewMode, setPreviewMode, previewTheme, setPreviewTheme,
    issues, setIssues, dirty, setDirty, imageFailed, setImageFailed,
    update, updateVisual, resetEditor,
  } = useProductEditorState();
  const [notice, setNotice] = useState("");
  const { busy, beginOperation, endOperation, operationActive } = useOperationLock();
  const {
    query, setQuery, view, setView, listMode, setListMode,
    statusFilter, setStatusFilter, categoryFilter, setCategoryFilter,
    filteredProducts,
  } = useCatalogListState({ catalog, drafts });

  const load = useCallback(async () => {
    const [nextCatalog, nextOptions, nextDrafts, nextBackups] = await Promise.all([
      api("/api/catalog"), api("/api/options"), api("/api/drafts"), api("/api/backups"),
    ]);
    setCatalog(nextCatalog);
    setOptions(nextOptions);
    setDrafts(nextDrafts);
    setBackups(nextBackups);
    setProduct((current) => current.categorySlug || !nextCatalog.categories[0]
      ? current
      : { ...current, categorySlug: nextCatalog.categories[0].slug });
  }, [api, setProduct]);

  const {
    deleteDialog,
    setDeleteDialog,
    openDelete,
    closeDeleteDialog,
    confirmDelete,
  } = useDeleteProductFlow({
    api,
    load,
    setNotice,
    beginOperation,
    endOperation,
    operationActive,
  });

  useEffect(() => { load().catch((error) => setNotice(error.message)); }, [load]);
  useUnsavedChangesGuard(dirty);

  const confirmDiscard = () => !dirty || window.confirm("Perubahan yang belum disimpan akan hilang. Lanjutkan?");
  const discardTemp = async (media = tempMedia) => {
    if (!media?.tempName) return;
    await api("/api/media/discard", { method: "POST", body: { tempName: media.tempName } }).catch(() => {});
  };
  const choose = async (item, sourceMode) => {
    if (operationActive() || !confirmDiscard()) return;
    await discardTemp();
    const copy = clone(item);
    const draftMeta = copy._draft || null;
    delete copy._draft;
    setProduct(copy);
    setMode(sourceMode);
    setTempMedia(draftMeta?.tempMedia || null);
    setPreviewUrl(draftMeta?.tempMedia?.tempName ? `/temp-media/${draftMeta.tempMedia.tempName}` : "");
    setIssues(null);
    setDirty(false);
    setImageFailed(false);
    setActiveTab("general");
    setPreviewMode("mobile");
    setView("editor");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const newProduct = async () => {
    if (operationActive() || !confirmDiscard()) return;
    await discardTemp();
    const next = blankProduct();
    if (catalog?.categories[0]) next.categorySlug = catalog.categories[0].slug;
    setProduct(next);
    setMode("new");
    resetEditor();
    setDirty(false);
    setView("editor");
  };
  const cancelEditor = async () => {
    if (operationActive() || !confirmDiscard()) return;
    await discardTemp();
    setDirty(false);
    resetEditor();
    setView("products");
    setListMode(mode === "draft" ? "draft" : "source");
  };
  const updateName = (value) => {
    const changes = { name: value, updatedAt: today() };
    if (mode === "new") Object.assign(changes, createUniqueProductIdentity(value, [...(catalog?.products || []), ...drafts]));
    setProduct((current) => ({ ...current, ...changes, imageAlt: current.imageAlt || value }));
    setDirty(true);
    setIssues(null);
  };
  const duplicateProduct = async (item) => {
    if (operationActive() || !confirmDiscard()) return;
    await discardTemp();
    const source = clone(item);
    const draftMeta = source._draft || null;
    delete source._draft;
    const duplicateName = `${source.name || "Produk"} Salinan`;
    const identity = createUniqueProductIdentity(duplicateName, [...(catalog?.products || []), ...drafts]);
    setProduct({
      ...source,
      ...identity,
      name: duplicateName,
      status: "draft",
      featured: false,
      newest: false,
      reviewedAt: "",
      updatedAt: today(),
      affiliateLinks: [],
      contentReferences: [],
    });
    setMode("new");
    setTempMedia(draftMeta?.tempMedia || null);
    setPreviewUrl(draftMeta?.tempMedia?.tempName ? `/temp-media/${draftMeta.tempMedia.tempName}` : "");
    setIssues(null);
    setDirty(true);
    setImageFailed(false);
    setActiveTab("general");
    setPreviewMode("mobile");
    setView("editor");
    setNotice("Salinan dibuat sebagai draft baru. Link affiliate dan konten sengaja dikosongkan untuk mencegah salah atribusi.");
  };

  const {
    upload,
    validate,
    saveDraft,
    apply,
    rollbackTarget,
    setRollbackTarget,
    rollback,
  } = useCatalogEditorOperations({
    api,
    product,
    tempMedia,
    setProduct,
    setTempMedia,
    setPreviewUrl,
    setImageFailed,
    setDirty,
    setIssues,
    setMode,
    setNotice,
    beginOperation,
    endOperation,
    load,
  });

  const {
    updateAffiliateLink,
    changeAffiliateMarketplace,
    removeAffiliateLink,
  } = useAffiliateLinkActions({ product, update });

  const showProducts = async (modeValue = "source", nextStatus = null) => {
    if (operationActive() || !confirmDiscard()) return;
    if (view === "editor") {
      await discardTemp();
      resetEditor();
    }
    setListMode(modeValue);
    if (nextStatus !== null) setStatusFilter(nextStatus);
    setView("products");
    setIssues(null);
    setDirty(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const showBackups = async () => {
    if (operationActive() || !confirmDiscard()) return;
    if (view === "editor") {
      await discardTemp();
      resetEditor();
    }
    setDirty(false);
    setView("backups");
    await load().catch((error) => setNotice(error.message));
  };

  const categoryName = (slug) => catalog?.categories.find((item) => item.slug === slug)?.name || "Tanpa kategori";
  const productImageUrl = (item) => item.image ? `/catalog-media/${item.image.replace(/^images\/products\//, "")}` : "";
  const previewClass = `preview palette-${product.visual?.paletteId || "neutral"} scale-${product.visual?.imageScale || "medium"} position-${product.visual?.imagePosition || "center"}`;
  const sourceImage = product.image ? `/catalog-media/${product.image.replace(/^images\/products\//, "")}` : "";
  const previewImage = previewUrl || sourceImage;
  const errorCount = issues?.errors?.length || 0;
  const activeAffiliateLinks = orderActiveAffiliateLinks(product.affiliateLinks);
  const readinessChecks = getProductReadinessChecks({ product, catalog, drafts });
  const completion = readinessChecks.filter(([, ready]) => ready).length;
  const publishReady = completion === readinessChecks.length;
  const applyDisabled = busy || (product.status === "published" && !publishReady);


  if (!catalog || !options) return <main className="loading"><span className="loading__spinner" />Menyiapkan Catalog Manager…<p>{notice}</p></main>;

  return <div className="manager-shell">
    <ManagerHeader
      view={view}
      query={query}
      onQueryChange={setQuery}
      onOpenProducts={() => showProducts("source", "all")}
      busy={busy}
    />

    <ManagerSidebar
      view={view}
      listMode={listMode}
      mode={mode}
      statusFilter={statusFilter}
      productCount={catalog.products.length}
      draftCount={drafts.length}
      reviewCount={catalog.products.filter((item) => item.status !== "published").length}
      backupCount={backups.length}
      busy={busy}
      onNewProduct={newProduct}
      onShowProducts={showProducts}
      onShowBackups={showBackups}
    />

    <main className="manager-main">
      {notice && <div className="notice" role="status"><span>i</span><p>{notice}</p></div>}

      {view === "products" && <ProductLibrary
        catalog={catalog}
        drafts={drafts}
        filteredProducts={filteredProducts}
        listMode={listMode}
        statusFilter={statusFilter}
        categoryFilter={categoryFilter}
        query={query}
        onQueryChange={setQuery}
        onStatusFilterChange={setStatusFilter}
        onCategoryFilterChange={setCategoryFilter}
        onNewProduct={newProduct}
        onEdit={(item) => choose(item, listMode === "draft" ? "draft" : "source")}
        onDuplicate={duplicateProduct}
        onDelete={(item) => openDelete(item, listMode === "draft")}
        categoryName={categoryName}
        productImageUrl={productImageUrl}
      />}

      {view === "backups" && (
        <BackupHistory
          backups={backups}
          busy={busy}
          onReload={() => load().catch((error) => setNotice(error.message))}
          onSelectBackup={setRollbackTarget}
        />
      )}

      {view === "editor" && (
        <ProductEditorView
          product={product}
          catalog={catalog}
          options={options}
          mode={mode}
          busy={busy}
          activeTab={activeTab}
          tempMedia={tempMedia}
          previewMode={previewMode}
          previewTheme={previewTheme}
          previewClass={previewClass}
          previewImage={previewImage}
          imageFailed={imageFailed}
          issues={issues}
          errorCount={errorCount}
          activeAffiliateLinks={activeAffiliateLinks}
          readinessChecks={readinessChecks}
          completion={completion}
          publishReady={publishReady}
          applyDisabled={applyDisabled}
          categoryName={categoryName}
          onCancel={cancelEditor}
          onSaveDraft={saveDraft}
          onValidate={validate}
          onApply={apply}
          onUpload={upload}
          onUpdate={update}
          onUpdateName={updateName}
          onUpdateVisual={updateVisual}
          onActiveTabChange={setActiveTab}
          onPreviewModeChange={setPreviewMode}
          onPreviewThemeToggle={() => setPreviewTheme((value) => value === "dark" ? "light" : "dark")}
          onImageError={() => setImageFailed(true)}
          onChangeAffiliateMarketplace={changeAffiliateMarketplace}
          onUpdateAffiliateLink={updateAffiliateLink}
          onRemoveAffiliateLink={removeAffiliateLink}
        />
      )}
    </main>

    <DeleteProductDialog
      dialog={deleteDialog}
      busy={busy}
      onClose={closeDeleteDialog}
      onConfirm={confirmDelete}
      onTypedNameChange={(typedName) => setDeleteDialog((current) => current ? { ...current, typedName } : current)}
      onConfirmedChange={(confirmed) => setDeleteDialog((current) => current ? { ...current, confirmed } : current)}
      productImageUrl={productImageUrl}
    />

    <RollbackDialog
      target={rollbackTarget}
      busy={busy}
      onClose={() => setRollbackTarget(null)}
      onConfirm={rollback}
    />
  </div>;
}
