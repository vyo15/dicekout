import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { FiBookmark, FiMenu, FiMoon, FiSearch, FiSun, FiX } from "react-icons/fi";
import BrandLogo from "../common/BrandLogo";
import MobileBottomNavigation from "./MobileBottomNavigation";
import MobileMoreMenu from "./MobileMoreMenu";
import { SITE } from "../../config/site";
import { applyTheme, getInitialTheme, toggleThemeValue } from "../../utils/theme";
import { useProductPreferences } from "../../hooks/useProductPreferences";

const navigation = [
  { to: "/", label: "Beranda", end: true },
  { to: "/produk", label: "Semua Produk" },
  { to: "/kategori", label: "Kategori" },
  { to: "/koleksi", label: "Koleksi" },
  { to: "/tentang", label: "Tentang" },
];

const SiteLayout = () => {
  const [theme, setTheme] = useState(getInitialTheme);
  const { savedProducts } = useProductPreferences();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    setMenuOpen(false);
    setMoreMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const tabletNavigation = window.matchMedia("(min-width: 641px) and (max-width: 920px)");

    const syncTabletMenu = () => {
      const shouldLock = menuOpen && tabletNavigation.matches;
      document.body.classList.toggle("menu-open", shouldLock);
      if (menuOpen && !tabletNavigation.matches) setMenuOpen(false);
    };

    syncTabletMenu();
    tabletNavigation.addEventListener("change", syncTabletMenu);

    const onKeyDown = (event) => {
      if (event.key === "Escape" && menuOpen) setMenuOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.classList.remove("menu-open");
      tabletNavigation.removeEventListener("change", syncTabletMenu);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    const mobileNavigation = window.matchMedia("(max-width: 640px)");

    const closeMoreMenuOutsideMobile = () => {
      if (!mobileNavigation.matches) setMoreMenuOpen(false);
    };

    closeMoreMenuOutsideMobile();
    mobileNavigation.addEventListener("change", closeMoreMenuOutsideMobile);

    return () => mobileNavigation.removeEventListener("change", closeMoreMenuOutsideMobile);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((value) => toggleThemeValue(value));
  }, []);

  const closeMoreMenu = useCallback(() => setMoreMenuOpen(false), []);

  const openMoreMenu = useCallback(() => {
    setMenuOpen(false);
    setMoreMenuOpen(true);
  }, []);

  const openCatalogSearch = useCallback(() => {
    setMenuOpen(false);
    setMoreMenuOpen(false);

    const onProductsPage = location.pathname === "/produk";
    const destination = onProductsPage
      ? `${location.pathname}${location.search}`
      : "/produk";

    navigate(destination, {
      replace: onProductsPage,
      state: { focusCatalogSearch: true },
    });
  }, [location.pathname, location.search, navigate]);

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
            <NavLink
              className="icon-button saved-products-link"
              to="/tersimpan"
              aria-label={`Produk tersimpan${savedProducts.length ? `, ${savedProducts.length} produk` : ""}`}
              title="Produk tersimpan"
            >
              <FiBookmark aria-hidden="true" />
              {savedProducts.length ? <span>{savedProducts.length}</span> : null}
            </NavLink>
            <button
              className="icon-button"
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Aktifkan tema terang" : "Aktifkan tema gelap"}
              title={theme === "dark" ? "Tema terang" : "Tema gelap"}
            >
              {theme === "dark" ? <FiSun aria-hidden="true" /> : <FiMoon aria-hidden="true" />}
            </button>
            <NavLink
              className="header-search-button"
              to="/produk"
              state={{ focusCatalogSearch: true }}
            >
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
          <nav className="mobile-menu__nav container" aria-label="Navigasi tablet">
            {navigation.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>


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
            <NavLink to="/kategori">Kategori</NavLink>
            <NavLink to="/koleksi">Koleksi</NavLink>
            <NavLink to="/tersimpan">Produk Tersimpan</NavLink>
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

      <MobileBottomNavigation
        onSearch={openCatalogSearch}
        onMore={openMoreMenu}
        moreOpen={moreMenuOpen}
      />
      <MobileMoreMenu
        open={moreMenuOpen}
        onClose={closeMoreMenu}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    </div>
  );
};

export default SiteLayout;
