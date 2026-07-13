import { useEffect, useMemo, useState } from "react";
import { createUniqueProductIdentity } from "./productIdentity.js";
import { FiArrowLeft, FiBox, FiCheckCircle, FiEdit3, FiFileText, FiPlus, FiSearch } from "react-icons/fi";

const lines = (value) => String(value || "").split("\n").map((item) => item.trim()).filter(Boolean);
const today = () => new Date().toISOString().slice(0, 10);
const clone = (value) => JSON.parse(JSON.stringify(value));
const blank = () => ({
  id: "", slug: "", name: "", summary: "", description: "", image: "", imageAlt: "",
  categorySlug: "", collectionSlugs: [], recommendationReason: "", pros: [], considerations: [],
  suitableFor: [], notSuitableFor: [], keywords: [], aliases: [], featured: false, newest: true,
  sortOrder: 999, status: "draft", demo: false, updatedAt: today(), reviewedAt: "",
  imageSource: "", imageLicense: "", imageWidth: 0, imageHeight: 0, affiliateLinks: [],
  contentReferences: [], visual: { paletteId: "neutral", imageFit: "contain", imageScale: "medium", imagePosition: "center" }
});

const tabs = [
  ["general", "Informasi utama"],
  ["content", "Rekomendasi"],
  ["links", "Link & konten"],
  ["publish", "Publikasi"]
];

function Section({ title, description, children }) {
  return <section className="editor-card"><div className="section-heading"><div><h2>{title}</h2>{description && <p>{description}</p>}</div></div>{children}</section>;
}

function Field({ label, hint, required, children, className = "" }) {
  return <label className={`field ${className}`}><span className="field__label">{label}{required && <b aria-hidden="true">*</b>}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export default function App() {
  const params = new URLSearchParams(location.search);
  const supplied = params.get("session");
  if (supplied) {
    sessionStorage.setItem("dicekout-manager-session", supplied);
    history.replaceState(null, "", location.pathname);
  }
  const session = sessionStorage.getItem("dicekout-manager-session") || "";
  const api = async (path, options = {}) => {
    const response = await fetch(path, { ...options, headers: { "content-type": "application/json", "x-dicekout-session": session, ...options.headers } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request gagal");
    return data;
  };

  const [catalog, setCatalog] = useState(null);
  const [options, setOptions] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [product, setProduct] = useState(blank());
  const [mode, setMode] = useState("new");
  const [activeTab, setActiveTab] = useState("general");
  const [tempMedia, setTempMedia] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
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

  const load = async () => {
    const [c, o, d] = await Promise.all([api("/api/catalog"), api("/api/options"), api("/api/drafts")]);
    setCatalog(c); setOptions(o); setDrafts(d);
    setProduct((current) => current.categorySlug || !c.categories[0] ? current : { ...current, categorySlug: c.categories[0].slug });
  };
  useEffect(() => { load().catch((error) => setNotice(error.message)); }, []);
  useEffect(() => {
    const preventClose = (event) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", preventClose);
    return () => window.removeEventListener("beforeunload", preventClose);
  }, [dirty]);

  const update = (key, value) => { setProduct((current) => ({ ...current, [key]: value, updatedAt: today() })); setDirty(true); setIssues(null); };
  const updateVisual = (key, value) => { setProduct((current) => ({ ...current, visual: { ...current.visual, [key]: value }, updatedAt: today() })); setDirty(true); setIssues(null); };
  const confirmDiscard = () => !dirty || window.confirm("Perubahan yang belum disimpan akan hilang. Lanjutkan?");
  const choose = (item, sourceMode) => {
    if (!confirmDiscard()) return;
    setProduct(clone(item)); setMode(sourceMode); setTempMedia(null); setPreviewUrl(""); setIssues(null); setDirty(false); setImageFailed(false); setActiveTab("general"); setView("editor"); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const newProduct = () => {
    if (!confirmDiscard()) return;
    const next = blank();
    if (catalog?.categories[0]) next.categorySlug = catalog.categories[0].slug;
    setProduct(next); setMode("new"); setTempMedia(null); setPreviewUrl(""); setIssues(null); setDirty(false); setImageFailed(false); setActiveTab("general"); setView("editor");
  };
  const updateName = (value) => {
    const changes = { name: value, updatedAt: today() };
    if (mode === "new") Object.assign(changes, createUniqueProductIdentity(value, catalog?.products, drafts));
    setProduct((current) => ({ ...current, ...changes, imageAlt: current.imageAlt || value }));
    setDirty(true); setIssues(null);
  };
  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const base64 = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1]); reader.onerror = reject; reader.readAsDataURL(file); });
      const result = await api("/api/media", { method: "POST", body: JSON.stringify({ base64, mime: file.type, name: product.name, slug: product.slug }) });
      setPreviewUrl(URL.createObjectURL(file)); setTempMedia(result); setImageFailed(false);
      setProduct((current) => ({ ...current, image: result.path, imageWidth: result.width, imageHeight: result.height, imageAlt: current.imageAlt || current.name }));
      setDirty(true); setNotice("Gambar siap dipreview dan masih berada di area temporary.");
    } catch (error) { setNotice(error.message); } finally { setBusy(false); }
  };
  const validate = async () => {
    setBusy(true);
    try {
      const result = await api("/api/validate", { method: "POST", body: JSON.stringify({ product }) });
      setIssues(result); setNotice(result.errors.length ? "Masih ada data wajib yang perlu diperbaiki." : "Validasi data berhasil."); return result;
    } catch (error) { setNotice(error.message); } finally { setBusy(false); }
  };
  const saveDraft = async () => {
    setBusy(true);
    try { await api("/api/drafts", { method: "POST", body: JSON.stringify({ product }) }); setNotice("Draft lokal tersimpan dan tidak masuk Git."); setDirty(false); await load(); }
    catch (error) { setNotice(error.message); } finally { setBusy(false); }
  };
  const apply = async () => {
    if (!window.confirm("Terapkan produk ke source? Backup dibuat otomatis. Commit dan push tetap dilakukan manual.")) return;
    setBusy(true);
    try {
      const result = await api("/api/apply", { method: "POST", body: JSON.stringify({ product, tempMedia }) });
      setIssues(result);
      if (result.errors.length) setNotice("Penerapan dibatalkan karena validasi gagal.");
      else { setNotice(`Produk diterapkan. Backup: ${result.backupId}. Jalankan npm run check dan review git diff.`); setTempMedia(null); setPreviewUrl(""); setDirty(false); setMode("source"); await load(); }
    } catch (error) { setNotice(error.message); } finally { setBusy(false); }
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
  const showProducts = (modeValue = "source") => {
    if (!confirmDiscard()) return;
    setListMode(modeValue);
    setView("products");
    setIssues(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const categoryName = (slug) => catalog?.categories.find((item) => item.slug === slug)?.name || "Tanpa kategori";
  const productImageUrl = (item) => item.image ? `/catalog-media/${item.image.replace(/^images\/products\//, "")}` : "";
  const previewClass = `preview palette-${product.visual?.paletteId || "neutral"} scale-${product.visual?.imageScale || "medium"} position-${product.visual?.imagePosition || "center"}`;
  const sourceImage = product.image ? `/catalog-media/${product.image.replace(/^images\/products\//, "")}` : "";
  const previewImage = previewUrl || sourceImage;
  const errorCount = issues?.errors?.length || 0;
  const completion = [product.name, product.summary, product.description, product.recommendationReason, product.image, product.categorySlug].filter(Boolean).length;

  if (!catalog || !options) return <main className="loading"><span className="loading__spinner" />Menyiapkan Catalog Manager…<p>{notice}</p></main>;

  return <div className="manager-shell">
    <header className="manager-header">
      <button className="manager-brand" type="button" onClick={() => showProducts("source")} aria-label="Buka daftar produk DicekOut.ID">
        <img className="manager-brand__logo" src="/brand-assets/dicekout-logo.png" alt="" />
        <span><strong>DicekOut.ID</strong><small>Catalog Manager</small></span>
      </button>
      <label className="manager-header__search">
        <FiSearch aria-hidden="true" />
        <input
          aria-label="Cari produk dari header"
          placeholder={view === "products" ? "Cari produk DicekOut..." : "Pencarian tersedia di daftar produk"}
          value={query}
          disabled={view !== "products"}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div className="manager-header__status">
        <span className="manager-header__status-dot" aria-hidden="true" />
        <span><strong>Local</strong><small>127.0.0.1:666</small></span>
      </div>
    </header>

    <aside className="sidebar">
      <button className="button button--accent button--full sidebar-add" onClick={newProduct}><FiPlus aria-hidden="true" /> <span>Tambah produk</span></button>
      <nav className="sidebar-nav" aria-label="Navigasi Catalog Manager">
        <button className={view === "products" && listMode === "source" && statusFilter !== "draft" ? "active" : ""} onClick={() => { setStatusFilter("all"); showProducts("source"); }}><FiBox aria-hidden="true" /><b>Produk</b><small>{catalog.products.length}</small></button>
        <button className={view === "editor" && mode === "new" ? "active" : ""} onClick={newProduct}><FiEdit3 aria-hidden="true" /><b>Produk baru</b></button>
        <button className={view === "products" && listMode === "draft" ? "active" : ""} onClick={() => showProducts("draft")}><FiFileText aria-hidden="true" /><b>Draft lokal</b><small>{drafts.length}</small></button>
        <button className={view === "products" && listMode === "source" && statusFilter === "draft" ? "active" : ""} onClick={() => { setView("products"); setListMode("source"); setStatusFilter("draft"); }}><FiCheckCircle aria-hidden="true" /><b>Perlu ditinjau</b><small>{catalog.products.filter((item) => item.status !== "published").length}</small></button>
      </nav>
      <div className="sidebar-local"><strong>Hanya lokal</strong><p>Panel tidak melakukan commit, push, atau deploy otomatis.</p></div>
    </aside>

    <main className="manager-main">
      {view === "products" ? <>
        <header className="topbar list-topbar"><div><span className="eyebrow">Katalog / {listMode === "draft" ? "Draft lokal" : "Produk"}</span><h1>{listMode === "draft" ? "Draft lokal" : "Kelola produk"}</h1><p>{listMode === "draft" ? "Lanjutkan draft yang hanya tersimpan di perangkat ini." : "Cari, filter, dan edit produk tanpa memenuhi sidebar."}</p></div><div className="topbar__actions"><button className="button button--accent" onClick={newProduct}><FiPlus aria-hidden="true" /> <span>Tambah produk</span></button></div></header>
        {notice && <div className="notice" role="status"><span>i</span><p>{notice}</p></div>}
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
              {filteredProducts.length ? filteredProducts.map((item) => <tr key={item.id || item.slug}><td><div className="catalog-product"><div className={`catalog-thumb palette-${item.visual?.paletteId || "neutral"}`}>{item.image ? <img src={productImageUrl(item)} alt="" /> : <span>Gambar</span>}</div><div><strong>{item.name || "Tanpa nama"}</strong><small>{item.slug || "Belum memiliki slug"}</small></div></div></td><td>{categoryName(item.categorySlug)}</td><td><span className={`catalog-status catalog-status--${item.status || "draft"}`}>{listMode === "draft" ? "Draft lokal" : item.status}</span></td><td>{item.updatedAt || "—"}</td><td><button className="table-action" onClick={() => choose(item, listMode === "draft" ? "draft" : "source")}><FiEdit3 aria-hidden="true" /><span>Edit</span></button></td></tr>) : <tr><td colSpan="5"><div className="catalog-empty"><strong>Belum ada produk yang cocok.</strong><p>Ubah pencarian atau filter, lalu coba kembali.</p></div></td></tr>}
            </tbody></table>
          </div>
          <div className="catalog-footer"><span>Menampilkan {filteredProducts.length} item</span><span>{listMode === "draft" ? "Draft hanya tersedia di perangkat ini" : "Data source DicekOut"}</span></div>
        </section>
      </> : <>
        <button className="editor-back" onClick={() => showProducts(mode === "draft" ? "draft" : "source")}><FiArrowLeft aria-hidden="true" /><span>Kembali ke daftar produk</span></button>

      <header className="topbar"><div><span className="eyebrow">Katalog / {mode === "new" ? "Produk baru" : "Edit produk"}</span><h1>{mode === "new" ? "Tambah produk baru" : product.name || "Edit produk"}</h1><p>Isi informasi produk, review preview, lalu terapkan ke source ketika sudah siap.</p></div><div className="topbar__actions"><button className="button" onClick={newProduct} disabled={busy}>Batal</button><button className="button" onClick={saveDraft} disabled={busy}>Simpan draft</button><button className="button button--dark" onClick={validate} disabled={busy}>Validasi</button><button className="button button--accent" onClick={apply} disabled={busy}>Terapkan ke source</button></div></header>
      {notice && <div className="notice" role="status"><span>i</span><p>{notice}</p></div>}

      <div className="editor-layout">
        <aside className="editor-aside">
          <Section title="Thumbnail" description="Gunakan PNG atau WebP transparan untuk efek visual terbaik.">
            <label className="upload-card"><div className={previewClass}>{previewImage && !imageFailed ? <img src={previewImage} alt={product.imageAlt || "Preview produk"} onError={() => setImageFailed(true)} /> : <div className="upload-placeholder"><strong>＋</strong><span>Pilih gambar produk</span><small>PNG, WebP, atau JPEG · maks. 8 MB</small></div>}</div><input type="file" accept="image/png,image/webp,image/jpeg" onChange={(event) => upload(event.target.files?.[0])} /></label>
            {product.image && <div className="media-meta"><span>{product.imageWidth || "?"} × {product.imageHeight || "?"} px</span><span>{tempMedia ? "Temporary" : "Source"}</span></div>}
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
            <Section title="Link affiliate" description="URL disimpan persis seperti input. Referral code, sub-ID, campaign, dan query attribution tidak diubah.">{product.affiliateLinks.map((link, index) => <div className="repeat-card" key={`${link.marketplace}-${index}`}><div className="repeat-card__grid"><Field label="Marketplace"><select value={link.marketplace} onChange={(event) => update("affiliateLinks", product.affiliateLinks.map((item, position) => position === index ? { ...item, marketplace: event.target.value } : item))}>{options.marketplaces.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field><Field label="Label tombol"><input placeholder="Cek di marketplace" value={link.label} onChange={(event) => update("affiliateLinks", product.affiliateLinks.map((item, position) => position === index ? { ...item, label: event.target.value } : item))} /></Field><Field label="URL affiliate asli" className="span-2"><input value={link.url} onChange={(event) => update("affiliateLinks", product.affiliateLinks.map((item, position) => position === index ? { ...item, url: event.target.value } : item))} /></Field></div><button className="text-button text-button--danger" onClick={() => update("affiliateLinks", product.affiliateLinks.filter((_, position) => position !== index))}>Hapus link</button></div>)}<button className="button" onClick={() => update("affiliateLinks", [...product.affiliateLinks, { marketplace: "shopee", label: "", url: "", status: "active", isPrimary: product.affiliateLinks.length === 0 }])}>＋ Tambah marketplace</button></Section>
            <Section title="Konten terkait" description="Hubungkan produk dengan video atau posting yang membawa pengunjung ke DicekOut.">{product.contentReferences.map((reference, index) => <div className="repeat-card" key={`${reference.platform}-${index}`}><div className="repeat-card__grid"><Field label="Platform"><select value={reference.platform} onChange={(event) => update("contentReferences", product.contentReferences.map((item, position) => position === index ? { ...item, platform: event.target.value } : item))}><option value="instagram">Instagram</option><option value="tiktok">TikTok</option><option value="youtube">YouTube</option><option value="facebook">Facebook</option><option value="other">Lainnya</option></select></Field><Field label="Judul konten"><input value={reference.label} onChange={(event) => update("contentReferences", product.contentReferences.map((item, position) => position === index ? { ...item, label: event.target.value } : item))} /></Field><Field label="URL posting" className="span-2"><input value={reference.url} onChange={(event) => update("contentReferences", product.contentReferences.map((item, position) => position === index ? { ...item, url: event.target.value } : item))} /></Field></div><button className="text-button text-button--danger" onClick={() => update("contentReferences", product.contentReferences.filter((_, position) => position !== index))}>Hapus konten</button></div>)}<button className="button" onClick={() => update("contentReferences", [...product.contentReferences, { platform: "instagram", label: "", url: "", publishedAt: "" }])}>＋ Tambah konten</button></Section>
          </>}

          {activeTab === "publish" && <>
            <Section title="Pengaturan publikasi" description="Produk published wajib memenuhi seluruh validasi live sebelum dapat diterapkan."><div className="form-grid"><Field label="Status"><select value={product.status} onChange={(event) => update("status", event.target.value)}><option value="draft">Draft</option><option value="published">Published</option></select></Field><Field label="Tanggal ditinjau"><input type="date" value={product.reviewedAt} onChange={(event) => update("reviewedAt", event.target.value)} /></Field><Field label="Urutan"><input type="number" value={product.sortOrder} onChange={(event) => update("sortOrder", Number(event.target.value))} /></Field><div className="toggle-group"><label><input type="checkbox" checked={product.featured} onChange={(event) => update("featured", event.target.checked)} /><span>Produk unggulan</span></label><label><input type="checkbox" checked={product.newest} onChange={(event) => update("newest", event.target.checked)} /><span>Tandai sebagai terbaru</span></label></div></div></Section>
            <Section title="Pemeriksaan akhir"><div className="review-summary"><div><strong>{completion}/6</strong><span>Data utama terisi</span></div><div><strong>{product.affiliateLinks.length}</strong><span>Link marketplace</span></div><div><strong>{product.contentReferences.length}</strong><span>Konten terkait</span></div><div><strong>{errorCount}</strong><span>Error validasi</span></div></div><button className="button button--dark" onClick={validate} disabled={busy}>Jalankan validasi lengkap</button></Section>
          </>}
        </section>

        <aside className="preview-pane">
          <div className="preview-pane__heading"><div><span className="eyebrow">Live preview</span><h2>Kartu produk</h2></div><span className="preview-device">Mobile</span></div>
          <div className="product-preview-card"><div className={previewClass}>{previewImage && !imageFailed ? <img src={previewImage} alt="" onError={() => setImageFailed(true)} /> : <span>Gambar produk</span>}</div><div className="product-preview-card__body"><small>{catalog.categories.find((item) => item.slug === product.categorySlug)?.name || "Kategori"}</small><h3>{product.name || "Nama produk"}</h3><p>{product.summary || "Ringkasan produk akan tampil di sini."}</p><span className="preview-link">Lihat detail →</span></div></div>
          {issues && <div className={`issues ${errorCount ? "issues--error" : "issues--ok"}`}><div className="issues__heading"><strong>{errorCount ? `${errorCount} error` : "Validasi lolos"}</strong>{issues.warnings.length > 0 && <span>{issues.warnings.length} warning</span>}</div>{issues.errors.map((item, index) => <p key={`error-${index}`}>{item}</p>)}{issues.warnings.map((item, index) => <p key={`warning-${index}`}>{item}</p>)}</div>}
          <div className="local-note"><strong>Hanya lokal</strong><p>Panel tidak melakukan commit, push, atau deploy otomatis.</p></div>
        </aside>
      </div>

      </>}
    </main>
  </div>;
}
