import { FiBox, FiCheckCircle, FiClock, FiEdit3, FiFileText, FiPlus } from "react-icons/fi";

export const ManagerSidebar = ({
  view,
  listMode,
  mode,
  statusFilter,
  productCount,
  draftCount,
  reviewCount,
  backupCount,
  busy,
  onNewProduct,
  onShowProducts,
  onShowBackups,
}) => (
  <aside className="sidebar">
    <button className="button button--accent button--full sidebar-add" onClick={onNewProduct} disabled={busy}>
      <FiPlus aria-hidden="true" /><span>Tambah produk</span>
    </button>
    <nav className="sidebar-nav" aria-label="Navigasi Catalog Manager">
      <button
        className={view === "products" && listMode === "source" && statusFilter !== "draft" ? "active" : ""}
        onClick={() => onShowProducts("source", "all")}
        disabled={busy}
      >
        <FiBox aria-hidden="true" /><b>Produk</b><small>{productCount}</small>
      </button>
      <button className={view === "editor" && mode === "new" ? "active" : ""} onClick={onNewProduct} disabled={busy}>
        <FiEdit3 aria-hidden="true" /><b>Produk baru</b>
      </button>
      <button className={view === "products" && listMode === "draft" ? "active" : ""} onClick={() => onShowProducts("draft")} disabled={busy}>
        <FiFileText aria-hidden="true" /><b>Draft lokal</b><small>{draftCount}</small>
      </button>
      <button
        className={view === "products" && listMode === "source" && statusFilter === "draft" ? "active" : ""}
        onClick={() => onShowProducts("source", "draft")}
        disabled={busy}
      >
        <FiCheckCircle aria-hidden="true" /><b>Perlu ditinjau</b><small>{reviewCount}</small>
      </button>
      <button className={view === "backups" ? "active" : ""} onClick={onShowBackups} disabled={busy}>
        <FiClock aria-hidden="true" /><b>Riwayat backup</b><small>{backupCount}</small>
      </button>
    </nav>
    <div className="sidebar-local">
      <strong>Hanya lokal</strong>
      <p>Panel tidak melakukan commit, push, atau deploy otomatis.</p>
    </div>
  </aside>
);
