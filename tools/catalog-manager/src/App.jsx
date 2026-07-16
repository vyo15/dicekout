import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiArrowLeft,
  FiBox,
  FiCheckCircle,
  FiClock,
  FiEdit3,
  FiFileText,
  FiImage,
  FiLink,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiSmartphone,
  FiTablet,
  FiUploadCloud,
  FiMonitor,
  FiMoon,
  FiSun,
} from "react-icons/fi";
import { getMarketplaceCtaPresets } from "../../../frontend/src/config/marketplaces.js";
import { createUniqueProductIdentity } from "./productIdentity.js";
import { Field, FieldGroup, Section } from "./components/ManagerPrimitives.jsx";
import { ProductLibrary } from "./components/ProductLibrary.jsx";
import { DeleteProductDialog } from "./components/DeleteProductDialog.jsx";
import { mergeDeleteImpact } from "./components/deleteDialogState.js";
import { RollbackDialog } from "./components/RollbackDialog.jsx";
import { ContentEditorTab } from "./components/editor/ContentEditorTab.jsx";
import { EditorTabs } from "./components/editor/EditorTabs.jsx";
import { GeneralEditorTab } from "./components/editor/GeneralEditorTab.jsx";
import { LinksEditorTab } from "./components/editor/LinksEditorTab.jsx";
import { PublishEditorTab } from "./components/editor/PublishEditorTab.jsx";
import { useCatalogManagerApi } from "./hooks/useCatalogManagerApi.js";
import {
  backupLabels,
  blankProduct,
  clone,
  formatBytes,
  formatDateTime,
  orderActiveAffiliateLinks,
  today,
} from "./catalogManagerUtils.js";

export default function App() {
  const { api } = useCatalogManagerApi();

  const [catalog, setCatalog] = useState(null);
  const [options, setOptions] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [backups, setBackups] = useState([]);
  const [product, setProduct] = useState(blankProduct());
  const [mode, setMode] = useState("new");
  const [activeTab, setActiveTab] = useState("general");
  const [tempMedia, setTempMedia] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewMode, setPreviewMode] = useState("mobile");
  const [previewTheme, setPreviewTheme] = useState("light");
  const [notice, setNotice] = useState("");
  const [issues, setIssues] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [query, setQuery] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const [view, setView] = useState("products");
  const [listMode, setListMode] = useState("source");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [rollbackTarget, setRollbackTarget] = useState(null);
  const operationRef = useRef(false);
  const deleteRequestRef = useRef(0);

  const beginOperation = () => {
    if (operationRef.current) return false;
    operationRef.current = true;
    setBusy(true);
    return true;
  };
  const endOperation = () => {
    operationRef.current = false;
    setBusy(false);
  };

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
  }, [api]);

  useEffect(() => { load().catch((error) => setNotice(error.message)); }, [load]);
  useEffect(() => {
    const preventClose = (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", preventClose);
    return () => window.removeEventListener("beforeunload", preventClose);
  }, [dirty]);

  const update = (key, value) => {
    setProduct((current) => ({ ...current, [key]: value, updatedAt: today() }));
    setDirty(true);
    setIssues(null);
  };
  const updateVisual = (key, value) => {
    setProduct((current) => ({ ...current, visual: { ...current.visual, [key]: value }, updatedAt: today() }));
    setDirty(true);
    setIssues(null);
  };
  const confirmDiscard = () => !dirty || window.confirm("Perubahan yang belum disimpan akan hilang. Lanjutkan?");
  const discardTemp = async (media = tempMedia) => {
    if (!media?.tempName) return;
    await api("/api/media/discard", { method: "POST", body: { tempName: media.tempName } }).catch(() => {});
  };
  const resetEditor = () => {
    setTempMedia(null);
    setPreviewUrl("");
    setIssues(null);
    setImageFailed(false);
    setActiveTab("general");
    setPreviewMode("mobile");
    setPreviewTheme("light");
  };
  const choose = async (item, sourceMode) => {
    if (operationRef.current || !confirmDiscard()) return;
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
    if (operationRef.current || !confirmDiscard()) return;
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
    if (operationRef.current || !confirmDiscard()) return;
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
    if (operationRef.current || !confirmDiscard()) return;
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

  const upload = async (file) => {
    if (!file || !beginOperation()) return;
    try {
      const result = await api("/api/media", {
        method: "POST",
        body: file,
        raw: true,
        headers: {
          "content-type": file.type || "application/octet-stream",
          "x-original-name": encodeURIComponent(file.name || ""),
          "x-product-name": encodeURIComponent(product.name || ""),
          "x-product-slug": encodeURIComponent(product.slug || ""),
          "x-replace-temp": tempMedia?.tempName || "",
        },
      });
      setPreviewUrl(`/temp-media/${result.tempName}`);
      setTempMedia(result);
      setImageFailed(false);
      setProduct((current) => ({
        ...current,
        image: result.path,
        imageWidth: result.optimized?.width || 0,
        imageHeight: result.optimized?.height || 0,
        imageAlt: current.imageAlt || current.name,
        updatedAt: today(),
      }));
      setDirty(true);
      setIssues(null);
      setNotice("Gambar berhasil dikonversi otomatis ke WebP dan siap dipreview.");
    } catch (error) {
      setNotice(`${error.message} Data produk lain tetap dipertahankan.`);
    } finally {
      endOperation();
    }
  };

  const validate = async () => {
    if (!beginOperation()) return null;
    try {
      const result = await api("/api/validate", { method: "POST", body: { product } });
      setIssues(result);
      setNotice(result.errors.length ? "Masih ada data wajib yang perlu diperbaiki." : "Validasi data berhasil.");
      return result;
    } catch (error) {
      setNotice(error.message);
      return null;
    } finally {
      endOperation();
    }
  };
  const saveDraft = async () => {
    if (!beginOperation()) return;
    try {
      await api("/api/drafts", { method: "POST", body: { product, tempMedia } });
      setNotice("Draft lokal tersimpan beserta referensi gambar temporary dan tidak masuk Git.");
      setDirty(false);
      setMode("draft");
      await load();
    } catch (error) {
      setNotice(error.message);
    } finally {
      endOperation();
    }
  };
  const apply = async () => {
    if (!window.confirm("Terapkan produk ke source? Backup dibuat otomatis. Commit dan push tetap dilakukan manual.")) return;
    if (!beginOperation()) return;
    try {
      const result = await api("/api/apply", { method: "POST", body: { product, tempMedia } });
      setIssues(result);
      if (result.errors.length) {
        setNotice("Penerapan dibatalkan karena validasi gagal.");
      } else {
        setNotice("Produk diterapkan dan backup lokal dibuat. Jalankan npm run check lalu review git diff.");
        setTempMedia(null);
        setPreviewUrl("");
        setDirty(false);
        setMode("source");
        await load();
      }
    } catch (error) {
      setNotice(error.message);
    } finally {
      endOperation();
    }
  };

  const closeDeleteDialog = () => {
    deleteRequestRef.current += 1;
    setDeleteDialog(null);
  };

  const openDelete = async (item, isDraft) => {
    if (operationRef.current) return;
    const requestId = deleteRequestRef.current + 1;
    deleteRequestRef.current = requestId;
    if (isDraft) {
      setDeleteDialog({ kind: "draft", item, typedName: "", confirmed: false, impact: null, loading: false, requestId });
      return;
    }
    setDeleteDialog({ kind: "source", item, typedName: "", confirmed: false, impact: null, loading: true, requestId });
    try {
      const impact = await api("/api/products/delete-impact", { method: "POST", body: { productId: item.id } });
      setDeleteDialog((current) => mergeDeleteImpact(current, requestId, item.id, impact));
    } catch (error) {
      if (deleteRequestRef.current !== requestId) return;
      setNotice(error.message);
      closeDeleteDialog();
    }
  };
  const confirmDelete = async () => {
    if (!deleteDialog || !beginOperation()) return;
    const target = deleteDialog;
    try {
      if (target.kind === "draft") {
        await api("/api/drafts/delete", { method: "POST", body: { draftKey: target.item._draft?.key || target.item.id || target.item.slug } });
        setNotice(`Draft “${target.item.name}” berhasil dihapus.`);
      } else {
        const result = await api("/api/products/delete", {
          method: "POST",
          body: {
            productId: target.impact.product.id,
            fingerprint: target.impact.fingerprint,
            confirmationName: target.typedName,
            confirmed: target.confirmed,
          },
        });
        const detail = result.deleted;
        setNotice(`Produk berhasil dihapus. ${detail.collections} relasi koleksi, ${detail.drafts} draft, dan ${detail.sourceMedia} gambar source dibersihkan. Backup lokal tersedia di Riwayat backup.`);
      }
      closeDeleteDialog();
      await load();
    } catch (error) {
      setNotice(error.message);
    } finally {
      endOperation();
    }
  };
  const rollback = async () => {
    if (!rollbackTarget || !beginOperation()) return;
    try {
      await api("/api/rollback", { method: "POST", body: { backupId: rollbackTarget.id } });
      setNotice("Backup berhasil dipulihkan. Kondisi sebelum rollback juga disimpan sebagai titik pemulihan baru.");
      setRollbackTarget(null);
      await load();
    } catch (error) {
      setNotice(error.message);
    } finally {
      endOperation();
    }
  };

  const updateAffiliateLink = (index, patch) => {
    let next = product.affiliateLinks.map((item, position) => position === index ? { ...item, ...patch } : item);
    if (patch.isPrimary) next = next.map((item, position) => ({ ...item, isPrimary: position === index }));
    if (patch.status === "inactive" && next[index]?.isPrimary) {
      next[index] = { ...next[index], isPrimary: false };
      const replacement = next.findIndex((item, position) => position !== index && item.status !== "inactive");
      if (replacement >= 0) next[replacement] = { ...next[replacement], isPrimary: true };
    }
    update("affiliateLinks", next);
  };
  const changeAffiliateMarketplace = (index, marketplace) => {
    const link = product.affiliateLinks[index];
    const currentPresets = getMarketplaceCtaPresets(link?.marketplace);
    const keepCustomLabel = Boolean(link?.label?.trim()) && !currentPresets.includes(link.label.trim());
    updateAffiliateLink(index, {
      marketplace,
      label: keepCustomLabel ? link.label : "",
    });
  };

  const removeAffiliateLink = (index) => {
    const removedPrimary = Boolean(product.affiliateLinks[index]?.isPrimary);
    const next = product.affiliateLinks.filter((_, position) => position !== index);
    if (removedPrimary && next.length) {
      const replacement = next.findIndex((item) => item.status !== "inactive");
      if (replacement >= 0) next[replacement] = { ...next[replacement], isPrimary: true };
    }
    update("affiliateLinks", next);
  };

  const filteredProducts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const source = listMode === "draft" ? drafts : (catalog?.products || []);
    return source.filter((item) => {
      const matchesKeyword = !keyword || `${item.name} ${item.slug} ${item.status} ${item.categorySlug}`.toLowerCase().includes(keyword);
      const matchesStatus = listMode === "draft" || statusFilter === "all" || item.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || item.categorySlug === categoryFilter;
      return matchesKeyword && matchesStatus && matchesCategory;
    });
  }, [catalog, drafts, query, listMode, statusFilter, categoryFilter]);

  const showProducts = async (modeValue = "source", nextStatus = null) => {
    if (operationRef.current || !confirmDiscard()) return;
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
    if (operationRef.current || !confirmDiscard()) return;
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
  const readinessChecks = [
    ["Nama produk", Boolean(product.name?.trim())],
    ["Slug publik", Boolean(product.slug?.trim())],
    ["Ringkasan", Boolean(product.summary?.trim())],
    ["Deskripsi", Boolean(product.description?.trim())],
    ["Gambar dan alt text", Boolean(product.image?.trim() && product.imageAlt?.trim())],
    ["Kategori", Boolean(product.categorySlug?.trim())],
    ["Alasan rekomendasi", Boolean(product.recommendationReason?.trim())],
    ["Kelebihan", product.pros.length > 0],
    ["Perhatian", product.considerations.length > 0],
    ["Cocok untuk", product.suitableFor.length > 0],
    ["Link marketplace aktif", activeAffiliateLinks.length > 0 || product.demo],
    ["Tanggal ditinjau", Boolean(product.reviewedAt) || product.status !== "published" || product.demo],
  ];
  const completion = readinessChecks.filter(([, ready]) => ready).length;


  if (!catalog || !options) return <main className="loading"><span className="loading__spinner" />Menyiapkan Catalog Manager…<p>{notice}</p></main>;

  return <div className="manager-shell">
    <header className="manager-header">
      <button className="manager-brand" type="button" onClick={() => showProducts("source", "all")} disabled={busy} aria-label="Buka daftar produk DicekOut.ID">
        <img className="manager-brand__logo" src="/brand-assets/dicekout-logo.png" alt="" />
        <span><strong>DicekOut.ID</strong><small>Catalog Manager</small></span>
      </button>
      <label className="manager-header__search">
        <FiSearch aria-hidden="true" />
        <input aria-label="Cari produk dari header" placeholder={view === "products" ? "Cari produk DicekOut..." : "Pencarian tersedia di daftar produk"} value={query} disabled={view !== "products"} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="manager-header__status"><span className="manager-header__status-dot" aria-hidden="true" /><span><strong>Local</strong><small>127.0.0.1:666</small></span></div>
    </header>

    <aside className="sidebar">
      <button className="button button--accent button--full sidebar-add" onClick={newProduct} disabled={busy}><FiPlus aria-hidden="true" /><span>Tambah produk</span></button>
      <nav className="sidebar-nav" aria-label="Navigasi Catalog Manager">
        <button className={view === "products" && listMode === "source" && statusFilter !== "draft" ? "active" : ""} onClick={() => showProducts("source", "all")} disabled={busy}><FiBox aria-hidden="true" /><b>Produk</b><small>{catalog.products.length}</small></button>
        <button className={view === "editor" && mode === "new" ? "active" : ""} onClick={newProduct} disabled={busy}><FiEdit3 aria-hidden="true" /><b>Produk baru</b></button>
        <button className={view === "products" && listMode === "draft" ? "active" : ""} onClick={() => showProducts("draft")} disabled={busy}><FiFileText aria-hidden="true" /><b>Draft lokal</b><small>{drafts.length}</small></button>
        <button className={view === "products" && listMode === "source" && statusFilter === "draft" ? "active" : ""} onClick={() => showProducts("source", "draft")} disabled={busy}><FiCheckCircle aria-hidden="true" /><b>Perlu ditinjau</b><small>{catalog.products.filter((item) => item.status !== "published").length}</small></button>
        <button className={view === "backups" ? "active" : ""} onClick={showBackups} disabled={busy}><FiClock aria-hidden="true" /><b>Riwayat backup</b><small>{backups.length}</small></button>
      </nav>
      <div className="sidebar-local"><strong>Hanya lokal</strong><p>Panel tidak melakukan commit, push, atau deploy otomatis.</p></div>
    </aside>

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

      {view === "backups" && <>
        <header className="topbar"><div><span className="eyebrow">Catalog Manager / Riwayat</span><h1>Backup & rollback</h1><p>Setiap operasi berisiko memiliki titik pemulihan lokal. Backup tidak ikut Git atau deployment.</p></div><div className="topbar__actions"><button className="button" onClick={() => load().catch((error) => setNotice(error.message))}><FiRefreshCw aria-hidden="true" />Muat ulang</button></div></header>
        <section className="backup-grid">
          {backups.length ? backups.map((backup) => <article className="backup-card" key={backup.id}><div className="backup-card__icon"><FiShield aria-hidden="true" /></div><div className="backup-card__body"><span className="eyebrow">{backupLabels[backup.operation] || backup.operation}</span><h2>{backup.product?.name || "Kondisi katalog"}</h2><p>{formatDateTime(backup.createdAt)}</p>{backup.issue && <small>{backup.issue}</small>}</div><button className="button" disabled={!backup.restorable || busy} onClick={() => setRollbackTarget(backup)}><FiRefreshCw aria-hidden="true" />Pulihkan</button></article>) : <div className="catalog-empty"><strong>Belum ada backup.</strong><p>Backup muncul setelah apply, delete, atau rollback.</p></div>}
        </section>
      </>}

      {view === "editor" && <>
        <button className="editor-back" type="button" onClick={cancelEditor} disabled={busy}><FiArrowLeft aria-hidden="true" /><span>Kembali ke daftar produk</span></button>
        <header className="topbar"><div><span className="eyebrow">Katalog / {mode === "new" ? "Produk baru" : mode === "draft" ? "Edit draft" : "Edit produk"}</span><h1>{mode === "new" ? "Tambah produk baru" : product.name || "Edit produk"}</h1><p>Isi informasi produk, review preview hasil akhir, lalu terapkan ke source ketika sudah siap.</p></div><div className="topbar__actions"><button className="button" onClick={cancelEditor} disabled={busy}>Batal</button><button className="button" onClick={saveDraft} disabled={busy}>Simpan draft</button><button className="button button--dark" onClick={validate} disabled={busy}>Validasi</button><button className="button button--accent" onClick={apply} disabled={busy}>Terapkan ke source</button></div></header>

        <div className="editor-layout">
          <aside className="editor-aside">
            <Section title="Thumbnail" description="Unggah JPG, PNG, atau WebP. Sistem otomatis mengonversi ke satu file WebP yang efisien.">
              <label className={`upload-card${busy ? " is-disabled" : ""}`}><div className={previewClass}>{previewImage && !imageFailed ? <img src={previewImage} alt={product.imageAlt || "Preview produk"} onError={() => setImageFailed(true)} /> : <div className="upload-placeholder"><FiUploadCloud aria-hidden="true" /><span>Pilih gambar produk</span><small>JPG, PNG, atau WebP · diproses otomatis</small></div>}</div><input type="file" accept="image/png,image/webp,image/jpeg" disabled={busy} onChange={(event) => upload(event.target.files?.[0])} /></label>
              {product.image && <div className="media-meta"><span>{product.imageWidth || "?"} × {product.imageHeight || "?"} px</span><span>{tempMedia ? "WebP temporary" : "Source"}</span></div>}
              {tempMedia?.optimized && <div className="optimization-summary"><div><small>Asli</small><strong>{formatBytes(tempMedia.original?.size)}</strong><span>{tempMedia.original?.width} × {tempMedia.original?.height} · {tempMedia.original?.format}</span></div><FiImage aria-hidden="true" /><div><small>Hasil</small><strong>{formatBytes(tempMedia.optimized.size)}</strong><span>{tempMedia.optimized.width} × {tempMedia.optimized.height} · WebP</span></div><b>Hemat {tempMedia.optimized.savedPercent}%</b></div>}
            </Section>
            <Section title="Status"><Field label="Status publikasi"><select value={product.status} onChange={(event) => update("status", event.target.value)}><option value="draft">Draft</option><option value="published">Published</option></select></Field><div className="status-summary"><span className={`status-dot status-dot--${product.status}`} /><div><strong>{product.status === "published" ? "Siap tampil" : "Belum dipublikasikan"}</strong><small>{product.status === "published" ? "Tetap wajib lolos validasi." : "Aman untuk dilanjutkan nanti."}</small></div></div></Section>
            <Section title="Detail produk"><Field label="Kategori" required><select value={product.categorySlug} onChange={(event) => update("categorySlug", event.target.value)}>{catalog.categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></Field><FieldGroup label="Koleksi"><div className="checkbox-list">{catalog.collections.map((item) => <label key={item.id}><input type="checkbox" checked={product.collectionSlugs.includes(item.slug)} onChange={(event) => update("collectionSlugs", event.target.checked ? [...product.collectionSlugs, item.slug] : product.collectionSlugs.filter((slug) => slug !== item.slug))} /><span>{item.name}</span></label>)}</div></FieldGroup></Section>
          </aside>

          <section className="editor-content">
            <EditorTabs activeTab={activeTab} onChange={setActiveTab} />
            <div
              id={`editor-panel-${activeTab}`}
              className="editor-tab-panel"
              role="tabpanel"
              aria-labelledby={`editor-tab-${activeTab}`}
              tabIndex={0}
            >
              {activeTab === "general" && (
                <GeneralEditorTab
                  product={product}
                  options={options}
                  update={update}
                  updateName={updateName}
                  updateVisual={updateVisual}
                />
              )}
              {activeTab === "content" && <ContentEditorTab product={product} update={update} />}
              {activeTab === "links" && (
                <LinksEditorTab
                  product={product}
                  options={options}
                  update={update}
                  changeAffiliateMarketplace={changeAffiliateMarketplace}
                  updateAffiliateLink={updateAffiliateLink}
                  removeAffiliateLink={removeAffiliateLink}
                />
              )}
              {activeTab === "publish" && (
                <PublishEditorTab
                  product={product}
                  update={update}
                  completion={completion}
                  readinessChecks={readinessChecks}
                  activeAffiliateLinks={activeAffiliateLinks}
                  errorCount={errorCount}
                  validate={validate}
                  busy={busy}
                />
              )}
            </div>
          </section>

          <aside className="preview-pane">
            <div className="preview-pane__heading"><div><span className="eyebrow">Live preview</span><h2>Halaman produk</h2></div><div className="preview-controls"><div className="preview-device-switch" role="group" aria-label="Ukuran preview"><button className={previewMode === "mobile" ? "active" : ""} onClick={() => setPreviewMode("mobile")} aria-label="Preview mobile"><FiSmartphone aria-hidden="true" /></button><button className={previewMode === "tablet" ? "active" : ""} onClick={() => setPreviewMode("tablet")} aria-label="Preview tablet"><FiTablet aria-hidden="true" /></button><button className={previewMode === "desktop" ? "active" : ""} onClick={() => setPreviewMode("desktop")} aria-label="Preview desktop"><FiMonitor aria-hidden="true" /></button></div><button className="preview-theme-toggle" type="button" onClick={() => setPreviewTheme((value) => value === "dark" ? "light" : "dark")} aria-label={previewTheme === "dark" ? "Preview tema terang" : "Preview tema gelap"}>{previewTheme === "dark" ? <FiSun aria-hidden="true" /> : <FiMoon aria-hidden="true" />}</button></div></div>
            <div className={`detail-preview detail-preview--${previewMode} detail-preview--theme-${previewTheme}`}>
              <div className={previewClass}>{previewImage && !imageFailed ? <img src={previewImage} alt="" onError={() => setImageFailed(true)} /> : <span>Gambar produk</span>}</div>
              <div className="detail-preview__body"><small>{categoryName(product.categorySlug)}</small><h3>{product.name || "Nama produk"}</h3><p>{product.summary || "Ringkasan produk akan tampil di sini."}</p>{product.demo && <span className="demo-badge">Produk demo</span>}<div className="preview-reason"><strong>Kenapa direkomendasikan?</strong><p>{product.recommendationReason || "Alasan rekomendasi akan tampil di sini."}</p></div>{activeAffiliateLinks.length > 0 && <div className="preview-cta-list">{activeAffiliateLinks.map((link, index) => <span key={`${link.marketplace}-${index}`} className={link.isPrimary ? "primary" : ""}><FiLink aria-hidden="true" />{link.label || options.marketplaces.find((item) => item.id === link.marketplace)?.defaultCta || "Cek marketplace"}</span>)}</div>}<small className="preview-disclosure">Tautan marketplace dapat berupa link affiliate. Harga dan ketersediaan mengikuti marketplace.</small>{product.pros.length > 0 && <div className="preview-list"><strong>Kelebihan</strong><ul>{product.pros.map((item) => <li key={item}>{item}</li>)}</ul></div>}{product.considerations.length > 0 && <div className="preview-list"><strong>Perlu diperhatikan</strong><ul>{product.considerations.map((item) => <li key={item}>{item}</li>)}</ul></div>}{product.contentReferences.length > 0 && <div className="preview-content-links"><strong>Lihat konten terkait</strong>{product.contentReferences.map((item, index) => <span key={`${item.platform}-${index}`}>{item.label || item.platform}</span>)}</div>}</div>
            </div>
            {issues && <div className={`issues ${errorCount ? "issues--error" : "issues--ok"}`}><div className="issues__heading"><strong>{errorCount ? `${errorCount} error` : "Validasi lolos"}</strong>{issues.warnings.length > 0 && <span>{issues.warnings.length} warning</span>}</div>{issues.errors.map((item, index) => <p key={`error-${index}`}>{item}</p>)}{issues.warnings.map((item, index) => <p key={`warning-${index}`}>{item}</p>)}</div>}
            <div className="local-note"><strong>Hanya lokal</strong><p>Panel tidak melakukan commit, push, atau deploy otomatis.</p></div>
          </aside>
        </div>
      </>}
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
