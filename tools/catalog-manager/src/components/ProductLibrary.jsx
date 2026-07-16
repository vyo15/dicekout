import { FiPlus, FiSearch } from "react-icons/fi";
import { ActionMenu } from "./ManagerPrimitives.jsx";

export function ProductLibrary({
  catalog,
  drafts,
  filteredProducts,
  listMode,
  statusFilter,
  categoryFilter,
  query,
  onQueryChange,
  onStatusFilterChange,
  onCategoryFilterChange,
  onNewProduct,
  onEdit,
  onDuplicate,
  onDelete,
  categoryName,
  productImageUrl,
}) {
  const sourceMode = listMode === "source";

  return <>
    <header className="topbar list-topbar">
      <div>
        <span className="eyebrow">Katalog / {listMode === "draft" ? "Draft lokal" : "Produk"}</span>
        <h1>{listMode === "draft" ? "Draft lokal" : "Kelola produk"}</h1>
        <p>{listMode === "draft" ? "Lanjutkan draft yang hanya tersimpan di perangkat ini." : "Cari, filter, edit, duplikat, atau hapus produk melalui workflow yang aman."}</p>
      </div>
      <div className="topbar__actions"><button className="button button--accent" onClick={onNewProduct}><FiPlus aria-hidden="true" /><span>Tambah produk</span></button></div>
    </header>

    <section className="catalog-metrics">
      <div><small>Total produk</small><strong>{catalog.products.length}</strong></div>
      <div><small>Published</small><strong>{catalog.products.filter((item) => item.status === "published").length}</strong></div>
      <div><small>Draft lokal</small><strong>{drafts.length}</strong></div>
      <div><small>Perlu ditinjau</small><strong>{catalog.products.filter((item) => item.status !== "published").length}</strong></div>
    </section>

    <section className="catalog-panel">
      <div className="catalog-toolbar">
        <label className="catalog-search"><FiSearch aria-hidden="true" /><input aria-label="Cari produk" placeholder="Cari nama, slug, status, atau kategori…" value={query} onChange={(event) => onQueryChange(event.target.value)} /></label>
        {sourceMode && <>
          <select aria-label="Filter status produk" value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)}><option value="all">Semua status</option><option value="published">Published</option><option value="draft">Draft</option></select>
          <select aria-label="Filter kategori produk" value={categoryFilter} onChange={(event) => onCategoryFilterChange(event.target.value)}><option value="all">Semua kategori</option>{catalog.categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select>
        </>}
      </div>

      <div className="catalog-table-wrap">
        <table className="catalog-table">
          <thead><tr><th>Produk</th><th>Kategori</th><th>Status</th><th>Diperbarui</th><th>Aksi</th></tr></thead>
          <tbody>
            {filteredProducts.length ? filteredProducts.map((item) => <tr key={item._draft?.key || item.id || item.slug}>
              <td><div className="catalog-product"><div className={`catalog-thumb palette-${item.visual?.paletteId || "neutral"}`}>{item.image ? <img src={item._draft?.tempMedia?.tempName ? `/temp-media/${item._draft.tempMedia.tempName}` : productImageUrl(item)} alt="" /> : <span>Gambar</span>}</div><div><strong>{item.name || "Tanpa nama"}</strong><small>{item.slug || "Belum memiliki slug"}</small></div></div></td>
              <td>{categoryName(item.categorySlug)}</td>
              <td><span className={`catalog-status catalog-status--${item.status || "draft"}`}>{listMode === "draft" ? "Draft lokal" : item.status}</span></td>
              <td>{item.updatedAt || "—"}</td>
              <td><ActionMenu item={item} isDraft={listMode === "draft"} onEdit={() => onEdit(item)} onDuplicate={() => onDuplicate(item)} onDelete={() => onDelete(item)} onOpen={() => window.open(`https://${catalog.site.domain}/produk/${encodeURIComponent(item.slug)}`, "_blank", "noopener")} /></td>
            </tr>) : <tr><td colSpan="5"><div className="catalog-empty"><strong>Belum ada produk yang cocok.</strong><p>Ubah pencarian atau filter, lalu coba kembali.</p></div></td></tr>}
          </tbody>
        </table>
      </div>

      <div className="catalog-footer"><span>Menampilkan {filteredProducts.length} item</span><span>{listMode === "draft" ? "Draft hanya tersedia di perangkat ini" : "Data source DicekOut"}</span></div>
    </section>
  </>;
}
