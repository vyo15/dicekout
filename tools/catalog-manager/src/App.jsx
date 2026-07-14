import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiArrowLeft,
  FiBox,
  FiCheckCircle,
  FiClock,
  FiCopy,
  FiEdit3,
  FiExternalLink,
  FiFileText,
  FiImage,
  FiLink,
  FiMoreHorizontal,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiSmartphone,
  FiTablet,
  FiTrash2,
  FiUploadCloud,
  FiX,
  FiMonitor,
} from "react-icons/fi";
import { createUniqueProductIdentity } from "./productIdentity.js";

const lines = (value) => String(value || "").split("\n").map((item) => item.trim()).filter(Boolean);
const today = () => new Date().toISOString().slice(0, 10);
const clone = (value) => JSON.parse(JSON.stringify(value));
const formatBytes = (value) => {
  const bytes = Number(value) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 102.4) / 10} KB`;
  return `${Math.round(bytes / 1024 / 102.4) / 10} MB`;
};
const formatDateTime = (value) => {
  if (!value) return "Waktu tidak tersedia";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
};
const safeHttpUrl = (value) => {
  try {
    const parsed = new URL(String(value || "").trim());
    return ["http:", "https:"].includes(parsed.protocol) && !parsed.username && !parsed.password ? parsed.href : "";
  } catch {
    return "";
  }
};
const blank = () => ({
  id: "", slug: "", name: "", summary: "", description: "", image: "", imageAlt: "",
  categorySlug: "", collectionSlugs: [], recommendationReason: "", pros: [], considerations: [],
  suitableFor: [], notSuitableFor: [], keywords: [], aliases: [], featured: false, newest: true,
  sortOrder: 999, status: "draft", demo: false, updatedAt: today(), reviewedAt: "",
  imageSource: "", imageLicense: "", imageWidth: 0, imageHeight: 0, affiliateLinks: [],
  contentReferences: [], visual: { paletteId: "neutral", imageFit: "contain", imageScale: "medium", imagePosition: "center" },
});
const tabs = [
  ["general", "Informasi utama"],
  ["content", "Rekomendasi"],
  ["links", "Link & konten"],
  ["publish", "Publikasi"],
];
const backupLabels = {
  "apply-product": "Penerapan produk",
  "delete-product": "Penghapusan produk",
  "pre-rollback": "Pengaman sebelum pemulihan",
  legacy: "Backup lama",
  invalid: "Backup tidak valid",
};

function Section({ title, description, children, className = "" }) {
  return <section className={`editor-card ${className}`}><div className="section-heading"><div><h2>{title}</h2>{description && <p>{description}</p>}</div></div>{children}</section>;
}

function Field({ label, hint, required, children, className = "" }) {
  return <label className={`field ${className}`}><span className="field__label">{label}{required && <b aria-hidden="true">*</b>}</span>{children}{hint && <small>{hint}</small>}</label>;
}

function Modal({ title, description, children, onClose, danger = false }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelector("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]");
    focusable?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeRef.current();
      if (event.key !== "Tab" || !dialog) return;
      const items = [...dialog.querySelectorAll("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]")];
      if (!items.length) return;
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={dialogRef} className={`modal-card ${danger ? "modal-card--danger" : ""}`} role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby={description ? "modal-description" : undefined}>
      <header className="modal-card__header"><div><span className="eyebrow">{danger ? "Tindakan berisiko" : "Konfirmasi"}</span><h2 id="modal-title">{title}</h2>{description && <p id="modal-description">{description}</p>}</div><button className="icon-button" type="button" onClick={onClose} aria-label="Tutup dialog"><FiX aria-hidden="true" /></button></header>
      {children}
    </section>
  </div>;
}

function ActionMenu({ item, isDraft, onEdit, onDuplicate, onDelete, onOpen }) {
  return <div className="row-actions">
    <button className="table-action" type="button" onClick={onEdit}><FiEdit3 aria-hidden="true" /><span>Edit</span></button>
    <details className="action-menu">
      <summary aria-label={`Aksi lain untuk ${item.name || "produk"}`}><FiMoreHorizontal aria-hidden="true" /></summary>
      <div className="action-menu__panel">
        {!isDraft && <button type="button" onClick={onOpen}><FiExternalLink aria-hidden="true" />Buka halaman produk</button>}
        <button type="button" onClick={onDuplicate}><FiCopy aria-hidden="true" />Duplikat {isDraft ? "draft" : "produk"}</button>
        <button className="danger" type="button" onClick={onDelete}><FiTrash2 aria-hidden="true" />Hapus {isDraft ? "draft" : "produk"}</button>
      </div>
    </details>
  </div>;
}

export default function App() {
  const params = new URLSearchParams(location.search);
  const supplied = params.get("session");
  if (supplied) {
    sessionStorage.setItem("dicekout-manager-session", supplied);
    history.replaceState(null, "", location.pathname);
  }
  const session = sessionStorage.getItem("dicekout-manager-session") || "";

  const api = async (path, { method = "GET", body, headers = {}, raw = false } = {}) => {
    const requestHeaders = { "x-dicekout-session": session, ...headers };
    let requestBody = body;
    if (body !== undefined && !raw) {
      requestHeaders["content-type"] = "application/json";
      requestBody = JSON.stringify(body);
    }
    const response = await fetch(path, { method, headers: requestHeaders, body: requestBody });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Request gagal.");
    return data;
  };

  const [catalog, setCatalog] = useState(null);
  const [options, setOptions] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [backups, setBackups] = useState([]);
  const [product, setProduct] = useState(blank());
  const [mode, setMode] = useState("new");
  const [activeTab, setActiveTab] = useState("general");
  const [tempMedia, setTempMedia] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewMode, setPreviewMode] = useState("mobile");
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

  const load = async () => {
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
  };

  useEffect(() => { load().catch((error) => setNotice(error.message)); }, []);
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
  };
  const choose = async (item, sourceMode) => {
    if (!confirmDiscard()) return;
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
    if (!confirmDiscard()) return;
    await discardTemp();
    const next = blank();
    if (catalog?.categories[0]) next.categorySlug = catalog.categories[0].slug;
    setProduct(next);
    setMode("new");
    resetEditor();
    setDirty(false);
    setView("editor");
  };
  const cancelEditor = async () => {
    if (!confirmDiscard()) return;
    await discardTemp();
    setDirty(false);
    resetEditor();
    setView("products");
    setListMode(mode === "draft" ? "draft" : "source");
  };
  const updateName = (value) => {
    const changes = { name: value, updatedAt: today() };
    if (mode === "new") Object.assign(changes, createUniqueProductIdentity(value, catalog?.products, drafts));
    setProduct((current) => ({ ...current, ...changes, imageAlt: current.imageAlt || value }));
    setDirty(true);
    setIssues(null);
  };
  const duplicateProduct = async (item) => {
    if (!confirmDiscard()) return;
    await discardTemp();
    const source = clone(item);
    const draftMeta = source._draft || null;
    delete source._draft;
    const duplicateName = `${source.name || "Produk"} Salinan`;
    const identity = createUniqueProductIdentity(duplicateName, catalog?.products, drafts);
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
    if (!file) return;
    setBusy(true);
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
      setBusy(false);
    }
  };

  const validate = async () => {
    setBusy(true);
    try {
      const result = await api("/api/validate", { method: "POST", body: { product } });
      setIssues(result);
      setNotice(result.errors.length ? "Masih ada data wajib yang perlu diperbaiki." : "Validasi data berhasil.");
      return result;
    } catch (error) {
      setNotice(error.message);
      return null;
    } finally {
      setBusy(false);
    }
  };
  const saveDraft = async () => {
    setBusy(true);
    try {
      await api("/api/drafts", { method: "POST", body: { product, tempMedia } });
      setNotice("Draft lokal tersimpan beserta referensi gambar temporary dan tidak masuk Git.");
      setDirty(false);
      setMode("draft");
      await load();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  };
  const apply = async () => {
    if (!window.confirm("Terapkan produk ke source? Backup dibuat otomatis. Commit dan push tetap dilakukan manual.")) return;
    setBusy(true);
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
      setBusy(false);
    }
  };

  const openDelete = async (item, isDraft) => {
    if (isDraft) {
      setDeleteDialog({ kind: "draft", item, typedName: "", confirmed: false, impact: null, loading: false });
      return;
    }
    setDeleteDialog({ kind: "source", item, typedName: "", confirmed: false, impact: null, loading: true });
    try {
      const impact = await api("/api/products/delete-impact", { method: "POST", body: { productId: item.id } });
      setDeleteDialog((current) => current ? { ...current, impact, loading: false } : current);
    } catch (error) {
      setNotice(error.message);
      setDeleteDialog(null);
    }
  };
  const confirmDelete = async () => {
    if (!deleteDialog) return;
    setBusy(true);
    try {
      if (deleteDialog.kind === "draft") {
        await api("/api/drafts/delete", { method: "POST", body: { draftKey: deleteDialog.item._draft?.key || deleteDialog.item.id || deleteDialog.item.slug } });
        setNotice(`Draft “${deleteDialog.item.name}” berhasil dihapus.`);
      } else {
        const result = await api("/api/products/delete", {
          method: "POST",
          body: {
            productId: deleteDialog.impact.product.id,
            fingerprint: deleteDialog.impact.fingerprint,
            confirmationName: deleteDialog.typedName,
            confirmed: deleteDialog.confirmed,
          },
        });
        const detail = result.deleted;
        setNotice(`Produk berhasil dihapus. ${detail.collections} relasi koleksi, ${detail.drafts} draft, dan ${detail.sourceMedia} gambar source dibersihkan. Backup lokal tersedia di Riwayat backup.`);
      }
      setDeleteDialog(null);
      await load();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  };
  const rollback = async () => {
    if (!rollbackTarget) return;
    setBusy(true);
    try {
      await api("/api/rollback", { method: "POST", body: { backupId: rollbackTarget.id } });
      setNotice("Backup berhasil dipulihkan. Kondisi sebelum rollback juga disimpan sebagai titik pemulihan baru.");
      setRollbackTarget(null);
      await load();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
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

  const showProducts = async (modeValue = "source") => {
    if (!confirmDiscard()) return;
    if (view === "editor") await discardTemp();
    setListMode(modeValue);
    setView("products");
    setIssues(null);
    setDirty(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const showBackups = async () => {
    if (!confirmDiscard()) return;
    if (view === "editor") await discardTemp();
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
  const completion = [product.name, product.summary, product.description, product.recommendationReason, product.image, product.categorySlug].filter(Boolean).length;
  const activeAffiliateLinks = product.affiliateLinks.filter((link) => link.status !== "inactive");
  const canConfirmSourceDelete = deleteDialog?.kind === "source"
    && deleteDialog.impact
    && deleteDialog.typedName === deleteDialog.impact.product.name
    && deleteDialog.confirmed;

  if (!catalog || !options) return <main className="loading"><span className="loading__spinner" />Menyiapkan Catalog Manager…<p>{notice}</p></main>;

  return <div className="manager-shell">
    <header className="manager-header">
      <button className="manager-brand" type="button" onClick={() => showProducts("source")} aria-label="Buka daftar produk DicekOut.ID">
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
      <button className="button button--accent button--full sidebar-add" onClick={newProduct}><FiPlus aria-hidden="true" /><span>Tambah produk</span></button>
      <nav className="sidebar-nav" aria-label="Navigasi Catalog Manager">
        <button className={view === "products" && listMode === "source" && statusFilter !== "draft" ? "active" : ""} onClick={() => { setStatusFilter("all"); showProducts("source"); }}><FiBox aria-hidden="true" /><b>Produk</b><small>{catalog.products.length}</small></button>
        <button className={view === "editor" && mode === "new" ? "active" : ""} onClick={newProduct}><FiEdit3 aria-hidden="true" /><b>Produk baru</b></button>
        <button className={view === "products" && listMode === "draft" ? "active" : ""} onClick={() => showProducts("draft")}><FiFileText aria-hidden="true" /><b>Draft lokal</b><small>{drafts.length}</small></button>
        <button className={view === "products" && listMode === "source" && statusFilter === "draft" ? "active" : ""} onClick={() => { setView("products"); setListMode("source"); setStatusFilter("draft"); }}><FiCheckCircle aria-hidden="true" /><b>Perlu ditinjau</b><small>{catalog.products.filter((item) => item.status !== "published").length}</small></button>
        <button className={view === "backups" ? "active" : ""} onClick={showBackups}><FiClock aria-hidden="true" /><b>Riwayat backup</b><small>{backups.length}</small></button>
      </nav>
      <div className="sidebar-local"><strong>Hanya lokal</strong><p>Panel tidak melakukan commit, push, atau deploy otomatis.</p></div>
    </aside>

    <main className="manager-main">
      {notice && <div className="notice" role="status"><span>i</span><p>{notice}</p></div>}

      {view === "products" && <>
        <header className="topbar list-topbar"><div><span className="eyebrow">Katalog / {listMode === "draft" ? "Draft lokal" : "Produk"}</span><h1>{listMode === "draft" ? "Draft lokal" : "Kelola produk"}</h1><p>{listMode === "draft" ? "Lanjutkan draft yang hanya tersimpan di perangkat ini." : "Cari, filter, edit, duplikat, atau hapus produk melalui workflow yang aman."}</p></div><div className="topbar__actions"><button className="button button--accent" onClick={newProduct}><FiPlus aria-hidden="true" /><span>Tambah produk</span></button></div></header>
        <section className="catalog-metrics">
          <div><small>Total produk</small><strong>{catalog.products.length}</strong></div>
          <div><small>Published</small><strong>{catalog.products.filter((item) => item.status === "published").length}</strong></div>
          <div><small>Draft lokal</small><strong>{drafts.length}</strong></div>
          <div><small>Perlu ditinjau</small><strong>{catalog.products.filter((item) => item.status !== "published").length}</strong></div>
        </section>
        <section className="catalog-panel">
          <div className="catalog-toolbar">
            <label className="catalog-search"><FiSearch aria-hidden="true" /><input aria-label="Cari produk" placeholder="Cari nama, slug, status, atau kategori…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
            {listMode === "source" && <><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Semua status</option><option value="published">Published</option><option value="draft">Draft</option></select><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="all">Semua kategori</option>{catalog.categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></>}
          </div>
          <div className="catalog-table-wrap">
            <table className="catalog-table"><thead><tr><th>Produk</th><th>Kategori</th><th>Status</th><th>Diperbarui</th><th>Aksi</th></tr></thead><tbody>
              {filteredProducts.length ? filteredProducts.map((item) => <tr key={item._draft?.key || item.id || item.slug}><td><div className="catalog-product"><div className={`catalog-thumb palette-${item.visual?.paletteId || "neutral"}`}>{item.image ? <img src={item._draft?.tempMedia?.tempName ? `/temp-media/${item._draft.tempMedia.tempName}` : productImageUrl(item)} alt="" /> : <span>Gambar</span>}</div><div><strong>{item.name || "Tanpa nama"}</strong><small>{item.slug || "Belum memiliki slug"}</small></div></div></td><td>{categoryName(item.categorySlug)}</td><td><span className={`catalog-status catalog-status--${item.status || "draft"}`}>{listMode === "draft" ? "Draft lokal" : item.status}</span></td><td>{item.updatedAt || "—"}</td><td><ActionMenu item={item} isDraft={listMode === "draft"} onEdit={() => choose(item, listMode === "draft" ? "draft" : "source")} onDuplicate={() => duplicateProduct(item)} onDelete={() => openDelete(item, listMode === "draft")} onOpen={() => window.open(`https://${catalog.site.domain}/produk/${encodeURIComponent(item.slug)}`, "_blank", "noopener")} /></td></tr>) : <tr><td colSpan="5"><div className="catalog-empty"><strong>Belum ada produk yang cocok.</strong><p>Ubah pencarian atau filter, lalu coba kembali.</p></div></td></tr>}
            </tbody></table>
          </div>
          <div className="catalog-footer"><span>Menampilkan {filteredProducts.length} item</span><span>{listMode === "draft" ? "Draft hanya tersedia di perangkat ini" : "Data source DicekOut"}</span></div>
        </section>
      </>}

      {view === "backups" && <>
        <header className="topbar"><div><span className="eyebrow">Catalog Manager / Riwayat</span><h1>Backup & rollback</h1><p>Setiap operasi berisiko memiliki titik pemulihan lokal. Backup tidak ikut Git atau deployment.</p></div><div className="topbar__actions"><button className="button" onClick={() => load().catch((error) => setNotice(error.message))}><FiRefreshCw aria-hidden="true" />Muat ulang</button></div></header>
        <section className="backup-grid">
          {backups.length ? backups.map((backup) => <article className="backup-card" key={backup.id}><div className="backup-card__icon"><FiShield aria-hidden="true" /></div><div className="backup-card__body"><span className="eyebrow">{backupLabels[backup.operation] || backup.operation}</span><h2>{backup.product?.name || "Kondisi katalog"}</h2><p>{formatDateTime(backup.createdAt)}</p></div><button className="button" disabled={!backup.restorable || busy} onClick={() => setRollbackTarget(backup)}><FiRefreshCw aria-hidden="true" />Pulihkan</button></article>) : <div className="catalog-empty"><strong>Belum ada backup.</strong><p>Backup muncul setelah apply, delete, atau rollback.</p></div>}
        </section>
      </>}

      {view === "editor" && <>
        <button className="editor-back" onClick={cancelEditor}><FiArrowLeft aria-hidden="true" /><span>Kembali ke daftar produk</span></button>
        <header className="topbar"><div><span className="eyebrow">Katalog / {mode === "new" ? "Produk baru" : mode === "draft" ? "Edit draft" : "Edit produk"}</span><h1>{mode === "new" ? "Tambah produk baru" : product.name || "Edit produk"}</h1><p>Isi informasi produk, review preview hasil akhir, lalu terapkan ke source ketika sudah siap.</p></div><div className="topbar__actions"><button className="button" onClick={cancelEditor} disabled={busy}>Batal</button><button className="button" onClick={saveDraft} disabled={busy}>Simpan draft</button><button className="button button--dark" onClick={validate} disabled={busy}>Validasi</button><button className="button button--accent" onClick={apply} disabled={busy}>Terapkan ke source</button></div></header>

        <div className="editor-layout">
          <aside className="editor-aside">
            <Section title="Thumbnail" description="Unggah JPG, PNG, atau WebP. Sistem otomatis mengonversi ke satu file WebP yang efisien.">
              <label className="upload-card"><div className={previewClass}>{previewImage && !imageFailed ? <img src={previewImage} alt={product.imageAlt || "Preview produk"} onError={() => setImageFailed(true)} /> : <div className="upload-placeholder"><FiUploadCloud aria-hidden="true" /><span>Pilih gambar produk</span><small>JPG, PNG, atau WebP · diproses otomatis</small></div>}</div><input type="file" accept="image/png,image/webp,image/jpeg" onChange={(event) => upload(event.target.files?.[0])} /></label>
              {product.image && <div className="media-meta"><span>{product.imageWidth || "?"} × {product.imageHeight || "?"} px</span><span>{tempMedia ? "WebP temporary" : "Source"}</span></div>}
              {tempMedia?.optimized && <div className="optimization-summary"><div><small>Asli</small><strong>{formatBytes(tempMedia.original?.size)}</strong><span>{tempMedia.original?.width} × {tempMedia.original?.height} · {tempMedia.original?.format}</span></div><FiImage aria-hidden="true" /><div><small>Hasil</small><strong>{formatBytes(tempMedia.optimized.size)}</strong><span>{tempMedia.optimized.width} × {tempMedia.optimized.height} · WebP</span></div><b>Hemat {tempMedia.optimized.savedPercent}%</b></div>}
            </Section>
            <Section title="Status"><Field label="Status publikasi"><select value={product.status} onChange={(event) => update("status", event.target.value)}><option value="draft">Draft</option><option value="published">Published</option></select></Field><div className="status-summary"><span className={`status-dot status-dot--${product.status}`} /><div><strong>{product.status === "published" ? "Siap tampil" : "Belum dipublikasikan"}</strong><small>{product.status === "published" ? "Tetap wajib lolos validasi." : "Aman untuk dilanjutkan nanti."}</small></div></div></Section>
            <Section title="Detail produk"><Field label="Kategori" required><select value={product.categorySlug} onChange={(event) => update("categorySlug", event.target.value)}>{catalog.categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></Field><Field label="Koleksi"><div className="checkbox-list">{catalog.collections.map((item) => <label key={item.id}><input type="checkbox" checked={product.collectionSlugs.includes(item.slug)} onChange={(event) => update("collectionSlugs", event.target.checked ? [...product.collectionSlugs, item.slug] : product.collectionSlugs.filter((slug) => slug !== item.slug))} /><span>{item.name}</span></label>)}</div></Field></Section>
          </aside>

          <section className="editor-content">
            <nav className="tabs" aria-label="Bagian editor">{tabs.map(([id, label]) => <button key={id} className={activeTab === id ? "active" : ""} onClick={() => setActiveTab(id)}>{label}</button>)}</nav>

            {activeTab === "general" && <>
              <Section title="Informasi utama" description="ID dan slug dibuat otomatis dari nama produk untuk mengurangi kesalahan."><div className="form-grid"><Field label="Nama produk" required className="span-2"><input value={product.name} onChange={(event) => updateName(event.target.value)} placeholder="Contoh: Lampu Meja LED Minimalis" /></Field><Field label="ID stabil" hint="Dibuat otomatis dan dikunci untuk menjaga relasi data."><input value={product.id} readOnly placeholder="Terisi otomatis" /></Field><Field label="Slug URL" hint="Dibuat otomatis dan tidak diubah setelah produk diterapkan."><input value={product.slug} readOnly placeholder="Terisi otomatis" /></Field><Field label="Ringkasan" required className="span-2"><textarea value={product.summary} onChange={(event) => update("summary", event.target.value)} placeholder="Ringkasan singkat yang tampil pada kartu produk." maxLength={180} /><span className="counter">{product.summary.length}/180</span></Field><Field label="Deskripsi" required className="span-2"><textarea className="textarea-large" value={product.description} onChange={(event) => update("description", event.target.value)} placeholder="Jelaskan fungsi, konteks penggunaan, dan hal penting secara objektif." /></Field></div></Section>
              <Section title="Gambar & tampilan" description="Pilih palette dan posisi yang membuat produk tetap jelas pada mobile maupun desktop."><div className="form-grid"><Field label="Alt gambar" required className="span-2"><input value={product.imageAlt} onChange={(event) => update("imageAlt", event.target.value)} placeholder="Deskripsi singkat gambar untuk aksesibilitas" /></Field><Field label="Sumber gambar"><input value={product.imageSource} onChange={(event) => update("imageSource", event.target.value)} placeholder="Contoh: Foto milik DicekOut" /></Field><Field label="Izin/lisensi"><input value={product.imageLicense} onChange={(event) => update("imageLicense", event.target.value)} placeholder="Contoh: owned / licensed" /></Field><Field label="Palette"><select value={product.visual.paletteId} onChange={(event) => updateVisual("paletteId", event.target.value)}>{options.productPalettes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field><Field label="Skala gambar"><select value={product.visual.imageScale} onChange={(event) => updateVisual("imageScale", event.target.value)}>{options.imageScales.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Posisi gambar"><select value={product.visual.imagePosition} onChange={(event) => updateVisual("imagePosition", event.target.value)}>{options.imagePositions.map((item) => <option key={item}>{item}</option>)}</select></Field></div></Section>
            </>}

            {activeTab === "content" && <>
              <Section title="Isi rekomendasi" description="Gunakan informasi nyata dan hindari klaim harga, stok, rating, atau diskon yang tidak terverifikasi."><div className="form-grid"><Field label="Alasan direkomendasikan" required className="span-2"><textarea className="textarea-large" value={product.recommendationReason} onChange={(event) => update("recommendationReason", event.target.value)} /></Field>{[["Kelebihan", "pros"], ["Perlu diperhatikan", "considerations"], ["Cocok untuk", "suitableFor"], ["Tidak cocok untuk", "notSuitableFor"]].map(([label, key]) => <Field key={key} label={label} hint="Satu poin per baris"><textarea value={(product[key] || []).join("\n")} onChange={(event) => update(key, lines(event.target.value))} /></Field>)}</div></Section>
              <Section title="Pencarian internal"><div className="form-grid"><Field label="Kata kunci" hint="Satu kata/frasa per baris"><textarea value={(product.keywords || []).join("\n")} onChange={(event) => update("keywords", lines(event.target.value))} /></Field><Field label="Alias pencarian" hint="Nama alternatif yang mungkin dicari pengunjung"><textarea value={(product.aliases || []).join("\n")} onChange={(event) => update("aliases", lines(event.target.value))} /></Field></div></Section>
            </>}

            {activeTab === "links" && <>
              <Section title="Link affiliate" description="URL disimpan tanpa mengubah referral code, sub-ID, campaign, UTM, atau query attribution.">
                {product.affiliateLinks.map((link, index) => <div className="repeat-card" key={`${link.marketplace}-${index}`}><div className="repeat-card__grid"><Field label="Marketplace"><select value={link.marketplace} onChange={(event) => updateAffiliateLink(index, { marketplace: event.target.value })}>{options.marketplaces.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field><Field label="Label tombol"><input placeholder="Cek di marketplace" value={link.label} onChange={(event) => updateAffiliateLink(index, { label: event.target.value })} /></Field><Field label="URL affiliate asli" className="span-2"><input value={link.url} onChange={(event) => updateAffiliateLink(index, { url: event.target.value })} /></Field><Field label="Status link"><select value={link.status || "active"} onChange={(event) => updateAffiliateLink(index, { status: event.target.value })}><option value="active">Aktif</option><option value="inactive">Nonaktif</option></select></Field><div className="link-controls"><label><input type="radio" name="primaryAffiliate" checked={Boolean(link.isPrimary)} disabled={link.status === "inactive"} onChange={() => updateAffiliateLink(index, { isPrimary: true })} /><span>Link utama</span></label>{safeHttpUrl(link.url) && <a href={safeHttpUrl(link.url)} target="_blank" rel="noopener sponsored nofollow"><FiExternalLink aria-hidden="true" />Periksa link</a>}</div></div><button className="text-button text-button--danger" onClick={() => removeAffiliateLink(index)}>Hapus link</button></div>)}
                <button className="button" onClick={() => update("affiliateLinks", [...product.affiliateLinks, { marketplace: "shopee", label: "", url: "", status: "active", isPrimary: product.affiliateLinks.length === 0 }])}>＋ Tambah marketplace</button>
              </Section>
              <Section title="Konten terkait" description="Hubungkan produk dengan video atau posting yang membawa pengunjung ke DicekOut.">
                {product.contentReferences.map((reference, index) => <div className="repeat-card" key={`${reference.platform}-${index}`}><div className="repeat-card__grid"><Field label="Platform"><select value={reference.platform} onChange={(event) => update("contentReferences", product.contentReferences.map((item, position) => position === index ? { ...item, platform: event.target.value } : item))}><option value="instagram">Instagram</option><option value="tiktok">TikTok</option><option value="youtube">YouTube</option><option value="facebook">Facebook</option><option value="other">Lainnya</option></select></Field><Field label="Judul konten"><input value={reference.label} onChange={(event) => update("contentReferences", product.contentReferences.map((item, position) => position === index ? { ...item, label: event.target.value } : item))} /></Field><Field label="URL posting" className="span-2"><input value={reference.url} onChange={(event) => update("contentReferences", product.contentReferences.map((item, position) => position === index ? { ...item, url: event.target.value } : item))} /></Field><Field label="Tanggal posting"><input type="date" value={reference.publishedAt || ""} onChange={(event) => update("contentReferences", product.contentReferences.map((item, position) => position === index ? { ...item, publishedAt: event.target.value } : item))} /></Field></div><button className="text-button text-button--danger" onClick={() => update("contentReferences", product.contentReferences.filter((_, position) => position !== index))}>Hapus konten</button></div>)}
                <button className="button" onClick={() => update("contentReferences", [...product.contentReferences, { platform: "instagram", label: "", url: "", publishedAt: "" }])}>＋ Tambah konten</button>
              </Section>
            </>}

            {activeTab === "publish" && <>
              <Section title="Pengaturan publikasi" description="Produk published wajib memenuhi seluruh validasi live sebelum dapat diterapkan."><div className="form-grid"><Field label="Status"><select value={product.status} onChange={(event) => update("status", event.target.value)}><option value="draft">Draft</option><option value="published">Published</option></select></Field><Field label="Tanggal ditinjau"><input type="date" value={product.reviewedAt} onChange={(event) => update("reviewedAt", event.target.value)} /></Field><Field label="Urutan"><input type="number" value={product.sortOrder} onChange={(event) => update("sortOrder", Number(event.target.value))} /></Field><div className="toggle-group"><label><input type="checkbox" checked={product.demo} onChange={(event) => update("demo", event.target.checked)} /><span>Produk contoh/demo</span></label><label><input type="checkbox" checked={product.featured} onChange={(event) => update("featured", event.target.checked)} /><span>Produk unggulan</span></label><label><input type="checkbox" checked={product.newest} onChange={(event) => update("newest", event.target.checked)} /><span>Tandai sebagai terbaru</span></label></div></div></Section>
              <Section title="Pemeriksaan akhir"><div className="review-summary"><div><strong>{completion}/6</strong><span>Data utama terisi</span></div><div><strong>{activeAffiliateLinks.length}</strong><span>Link aktif</span></div><div><strong>{product.contentReferences.length}</strong><span>Konten terkait</span></div><div><strong>{errorCount}</strong><span>Error validasi</span></div></div><button className="button button--dark" onClick={validate} disabled={busy}>Jalankan validasi lengkap</button></Section>
            </>}
          </section>

          <aside className="preview-pane">
            <div className="preview-pane__heading"><div><span className="eyebrow">Live preview</span><h2>Halaman produk</h2></div><div className="preview-device-switch" aria-label="Ukuran preview"><button className={previewMode === "mobile" ? "active" : ""} onClick={() => setPreviewMode("mobile")} aria-label="Preview mobile"><FiSmartphone aria-hidden="true" /></button><button className={previewMode === "tablet" ? "active" : ""} onClick={() => setPreviewMode("tablet")} aria-label="Preview tablet"><FiTablet aria-hidden="true" /></button><button className={previewMode === "desktop" ? "active" : ""} onClick={() => setPreviewMode("desktop")} aria-label="Preview desktop"><FiMonitor aria-hidden="true" /></button></div></div>
            <div className={`detail-preview detail-preview--${previewMode}`}>
              <div className={previewClass}>{previewImage && !imageFailed ? <img src={previewImage} alt="" onError={() => setImageFailed(true)} /> : <span>Gambar produk</span>}</div>
              <div className="detail-preview__body"><small>{categoryName(product.categorySlug)}</small><h3>{product.name || "Nama produk"}</h3><p>{product.summary || "Ringkasan produk akan tampil di sini."}</p>{product.demo && <span className="demo-badge">Produk demo</span>}<div className="preview-reason"><strong>Kenapa direkomendasikan?</strong><p>{product.recommendationReason || "Alasan rekomendasi akan tampil di sini."}</p></div>{activeAffiliateLinks.length > 0 && <div className="preview-cta-list">{activeAffiliateLinks.map((link, index) => <span key={`${link.marketplace}-${index}`} className={link.isPrimary ? "primary" : ""}><FiLink aria-hidden="true" />{link.label || options.marketplaces.find((item) => item.id === link.marketplace)?.defaultCta || "Cek marketplace"}</span>)}</div>}<small className="preview-disclosure">Tautan marketplace dapat berupa link affiliate. Harga dan ketersediaan mengikuti marketplace.</small>{product.pros.length > 0 && <div className="preview-list"><strong>Kelebihan</strong><ul>{product.pros.map((item) => <li key={item}>{item}</li>)}</ul></div>}{product.considerations.length > 0 && <div className="preview-list"><strong>Perlu diperhatikan</strong><ul>{product.considerations.map((item) => <li key={item}>{item}</li>)}</ul></div>}{product.contentReferences.length > 0 && <div className="preview-content-links"><strong>Lihat konten terkait</strong>{product.contentReferences.map((item, index) => <span key={`${item.platform}-${index}`}>{item.label || item.platform}</span>)}</div>}</div>
            </div>
            {issues && <div className={`issues ${errorCount ? "issues--error" : "issues--ok"}`}><div className="issues__heading"><strong>{errorCount ? `${errorCount} error` : "Validasi lolos"}</strong>{issues.warnings.length > 0 && <span>{issues.warnings.length} warning</span>}</div>{issues.errors.map((item, index) => <p key={`error-${index}`}>{item}</p>)}{issues.warnings.map((item, index) => <p key={`warning-${index}`}>{item}</p>)}</div>}
            <div className="local-note"><strong>Hanya lokal</strong><p>Panel tidak melakukan commit, push, atau deploy otomatis.</p></div>
          </aside>
        </div>
      </>}
    </main>

    {deleteDialog && <Modal title={deleteDialog.kind === "draft" ? `Hapus draft “${deleteDialog.item.name}”?` : "Hapus produk secara permanen"} description={deleteDialog.kind === "draft" ? "Draft dan temporary image eksklusifnya akan dibersihkan." : "Server akan memindai dan membersihkan seluruh relasi sebelum menulis source."} danger onClose={() => !busy && setDeleteDialog(null)}>
      {deleteDialog.loading ? <div className="dialog-loading"><span className="loading__spinner" />Menganalisis seluruh relasi produk…</div> : deleteDialog.kind === "draft" ? <>
        <div className="impact-summary"><div><small>Draft</small><strong>{deleteDialog.item.name}</strong></div><div><small>Gambar temporary</small><strong>{deleteDialog.item._draft?.tempMedia ? "Akan dicek pemakaiannya" : "Tidak ada"}</strong></div></div>
        <div className="modal-actions"><button className="button" onClick={() => setDeleteDialog(null)} disabled={busy}>Batal</button><button className="button button--danger" onClick={confirmDelete} disabled={busy}><FiTrash2 aria-hidden="true" />Hapus draft</button></div>
      </> : deleteDialog.impact && <>
        <div className="delete-product-identity"><div className={`catalog-thumb palette-${deleteDialog.item.visual?.paletteId || "neutral"}`}>{deleteDialog.item.image ? <img src={productImageUrl(deleteDialog.item)} alt="" /> : <span>Gambar</span>}</div><div><small>Produk target</small><strong>{deleteDialog.impact.product.name}</strong><span>{deleteDialog.impact.product.slug}</span></div></div>
        <div className="impact-grid"><div><small>Relasi koleksi</small><strong>{deleteDialog.impact.collections.length}</strong></div><div><small>Draft terkait</small><strong>{deleteDialog.impact.drafts.length}</strong></div><div><small>Link affiliate</small><strong>{deleteDialog.impact.product.affiliateLinks}</strong></div><div><small>Konten terkait</small><strong>{deleteDialog.impact.product.contentReferences}</strong></div></div>
        <div className="impact-list"><strong>Yang akan dilakukan otomatis</strong><ul><li>Hapus satu objek produk dari products.json.</li><li>Hapus ID produk dari seluruh koleksi yang terhubung.</li><li>Hapus draft dan temporary image terkait yang tidak dipakai data lain.</li><li>{deleteDialog.impact.product.imageProtected ? "Pertahankan gambar bawaan sistem." : deleteDialog.impact.product.imageShared ? `Pertahankan gambar karena masih digunakan ${deleteDialog.impact.product.imageUsers} data lain.` : "Hapus gambar source karena hanya digunakan produk ini."}</li><li>Buat backup lokal dan rollback otomatis jika validasi akhir gagal.</li></ul></div>
        <Field label={`Ketik nama produk: ${deleteDialog.impact.product.name}`}><input value={deleteDialog.typedName} onChange={(event) => setDeleteDialog((current) => ({ ...current, typedName: event.target.value }))} autoComplete="off" /></Field>
        <label className="danger-confirm"><input type="checkbox" checked={deleteDialog.confirmed} onChange={(event) => setDeleteDialog((current) => ({ ...current, confirmed: event.target.checked }))} /><span>Saya memahami bahwa produk dan seluruh relasinya akan dihapus permanen dari source.</span></label>
        <div className="modal-actions"><button className="button" onClick={() => setDeleteDialog(null)} disabled={busy}>Batal</button><button className="button button--danger" onClick={confirmDelete} disabled={busy || !canConfirmSourceDelete}><FiTrash2 aria-hidden="true" />Hapus produk</button></div>
      </>}
    </Modal>}

    {rollbackTarget && <Modal title="Pulihkan backup?" description="Kondisi katalog saat ini akan dibackup terlebih dahulu sebelum pemulihan dijalankan." onClose={() => !busy && setRollbackTarget(null)}>
      <div className="impact-summary"><div><small>Jenis backup</small><strong>{backupLabels[rollbackTarget.operation] || rollbackTarget.operation}</strong></div><div><small>Dibuat</small><strong>{formatDateTime(rollbackTarget.createdAt)}</strong></div>{rollbackTarget.product?.name && <div><small>Produk terkait</small><strong>{rollbackTarget.product.name}</strong></div>}</div>
      <div className="modal-actions"><button className="button" onClick={() => setRollbackTarget(null)} disabled={busy}>Batal</button><button className="button button--dark" onClick={rollback} disabled={busy}><FiRefreshCw aria-hidden="true" />Pulihkan backup</button></div>
    </Modal>}
  </div>;
}
