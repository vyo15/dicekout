import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { FiMenu, FiMoon, FiSearch, FiSun, FiX } from "react-icons/fi";
import BrandLogo from "../common/BrandLogo";
import DemoNotice from "../common/DemoNotice";
import { SITE } from "../../config/site";
import { applyTheme, getInitialTheme, toggleThemeValue } from "../../utils/theme";

const navigation = [
  { to: "/", label: "Beranda", end: true },
  { to: "/produk", label: "Semua Produk" },
  { to: "/kategori/elektronik", label: "Kategori" },
  { to: "/koleksi/produk-dari-video-terbaru", label: "Koleksi" },
  { to: "/tentang", label: "Tentang" },
];

const SiteLayout = () => {
  const [theme, setTheme] = useState(getInitialTheme);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);
    const onKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("menu-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">Lewati ke isi utama</a>
      <header className="site-header">
        <div className="site-header__inner container">
          <BrandLogo />

          <nav className="desktop-nav" aria-label="Navigasi utama">
            {navigation.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="site-header__actions">
            <button
              className="icon-button"
              type="button"
              onClick={() => setTheme((value) => toggleThemeValue(value))}
              aria-label={theme === "dark" ? "Aktifkan tema terang" : "Aktifkan tema gelap"}
              title={theme === "dark" ? "Tema terang" : "Tema gelap"}
            >
              {theme === "dark" ? <FiSun aria-hidden="true" /> : <FiMoon aria-hidden="true" />}
            </button>
            <NavLink className="header-search-button" to="/produk">
              <FiSearch aria-hidden="true" />
              <span>Cari Produk</span>
            </NavLink>
            <button
              className="menu-button"
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            >
              {menuOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
            </button>
          </div>
        </div>

        <div className={`mobile-menu${menuOpen ? " mobile-menu--open" : ""}`} id="mobile-navigation">
          <nav className="mobile-menu__nav container" aria-label="Navigasi mobile">
            {navigation.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <DemoNotice />

      <main id="main-content">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="site-footer__top container">
          <div className="site-footer__brand">
            <BrandLogo compact />
            <p>{SITE.tagline}</p>
            <p className="site-footer__muted">
              Katalog rekomendasi personal. Pembelian dilakukan langsung di marketplace terkait.
            </p>
          </div>

          <div className="site-footer__column">
            <h2>Jelajahi</h2>
            <NavLink to="/produk">Semua Produk</NavLink>
            <NavLink to="/koleksi/produk-dari-video-terbaru">Produk dari Konten</NavLink>
            <NavLink to="/tentang">Tentang DicekOut</NavLink>
          </div>

          <div className="site-footer__column">
            <h2>Informasi</h2>
            <NavLink to="/disclosure">Disclosure Affiliate</NavLink>
            <NavLink to="/privacy">Kebijakan Privasi</NavLink>
          </div>
        </div>

        <div className="site-footer__bottom container">
          <p>© {new Date().getFullYear()} DicekOut. Seluruh hak dilindungi.</p>
          <p>Harga, stok, dan promo mengikuti informasi terbaru di marketplace.</p>
        </div>
      </footer>
    </div>
  );
};

export default SiteLayout;
