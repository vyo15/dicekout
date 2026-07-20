import { FiSearch } from "react-icons/fi";

export const ManagerHeader = ({ view, query, onQueryChange, onOpenProducts, busy }) => (
  <header className="manager-header">
    <button
      className="manager-brand"
      type="button"
      onClick={onOpenProducts}
      disabled={busy}
      aria-label="Buka daftar produk DicekOut.ID"
    >
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
        onChange={(event) => onQueryChange(event.target.value)}
      />
    </label>
    <div className="manager-header__status">
      <span className="manager-header__status-dot" aria-hidden="true" />
      <span><strong>Local</strong><small>127.0.0.1:666</small></span>
    </div>
  </header>
);
