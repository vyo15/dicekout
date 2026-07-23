import { NavLink } from "react-router-dom";
import { FiBookmark, FiMenu, FiMoon, FiSearch, FiSun, FiX } from "react-icons/fi";
import BrandLogo from "../common/BrandLogo";

const SITE_NAVIGATION = [
  { to: "/", label: "Beranda", end: true },
  { to: "/produk", label: "Semua Produk" },
  { to: "/kategori", label: "Kategori" },
  { to: "/koleksi", label: "Tema" },
  { to: "/tentang", label: "Tentang" },
];

const NavigationLinks = ({ className, label }) => (
  <nav className={className} aria-label={label}>
    {SITE_NAVIGATION.map((item) => (
      <NavLink key={item.to} to={item.to} end={item.end}>
        {item.label}
      </NavLink>
    ))}
  </nav>
);

const SiteHeader = ({ theme, savedCount, menuOpen, onToggleMenu, onToggleTheme }) => (
  <header className="site-header">
    <div className="site-header__inner container">
      <BrandLogo />
      <NavigationLinks className="desktop-nav" label="Navigasi utama" />

      <div className="site-header__actions">
        <NavLink
          className="icon-button saved-products-link"
          to="/tersimpan"
          aria-label={`Koleksi${savedCount ? `, ${savedCount} produk` : ""}`}
          title="Koleksi"
        >
          <FiBookmark aria-hidden="true" />
          {savedCount ? <span>{savedCount}</span> : null}
        </NavLink>
        <button
          className="icon-button"
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "Aktifkan tema terang" : "Aktifkan tema gelap"}
          title={theme === "dark" ? "Tema terang" : "Tema gelap"}
        >
          {theme === "dark" ? <FiSun aria-hidden="true" /> : <FiMoon aria-hidden="true" />}
        </button>
        <NavLink className="header-search-button" to="/produk" state={{ focusCatalogSearch: true }}>
          <FiSearch aria-hidden="true" />
          <span>Cari Produk</span>
        </NavLink>
        <button
          className="menu-button"
          type="button"
          onClick={onToggleMenu}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
        >
          {menuOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
        </button>
      </div>
    </div>

    <div className={`mobile-menu${menuOpen ? " mobile-menu--open" : ""}`} id="mobile-navigation">
      <NavigationLinks className="mobile-menu__nav container" label="Navigasi tablet" />
    </div>
  </header>
);

export default SiteHeader;
