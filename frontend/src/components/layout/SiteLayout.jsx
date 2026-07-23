import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import MobileBottomNavigation from "./MobileBottomNavigation";
import MobileMoreMenu from "./MobileMoreMenu";
import SiteFooter from "./SiteFooter.jsx";
import SiteHeader from "./SiteHeader.jsx";
import PreferenceToast from "../feedback/PreferenceToast.jsx";
import { applyTheme, getInitialTheme, toggleThemeValue } from "../../utils/theme";
import { useProductPreferences } from "../../hooks/useProductPreferences";

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
      <SiteHeader
        theme={theme}
        savedCount={savedProducts.length}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((value) => !value)}
        onToggleTheme={toggleTheme}
      />


      <main id="main-content">
        <Outlet />
      </main>

      <SiteFooter />

      <MobileBottomNavigation
        savedCount={savedProducts.length}
        onSearch={openCatalogSearch}
        onMore={openMoreMenu}
        moreOpen={moreMenuOpen}
      />
      <PreferenceToast />
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
