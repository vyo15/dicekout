import { NavLink, useLocation } from "react-router-dom";
import {
  FiBookmark,
  FiGrid,
  FiHome,
  FiMoreHorizontal,
  FiSearch,
} from "react-icons/fi";

const navItemClassName = ({ isActive }) => (
  `mobile-bottom-nav__item${isActive ? " mobile-bottom-nav__item--active" : ""}`
);

const MobileBottomNavigation = ({ savedCount = 0, onSearch, onMore, moreOpen }) => {
  const location = useLocation();
  const moreRouteActive = ["/kategori", "/koleksi", "/tentang", "/disclosure", "/privacy"]
    .some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`));
  const badgeLabel = savedCount > 9 ? "9+" : String(savedCount);

  return (
    <nav className="mobile-bottom-nav" aria-label="Navigasi utama mobile">
      <div className="mobile-bottom-nav__inner">
        <NavLink className={navItemClassName} to="/" end>
          <span className="mobile-bottom-nav__icon"><FiHome aria-hidden="true" /></span>
          <span>Beranda</span>
        </NavLink>

        <NavLink className={navItemClassName} to="/produk">
          <span className="mobile-bottom-nav__icon"><FiGrid aria-hidden="true" /></span>
          <span>Produk</span>
        </NavLink>

        <button
          className="mobile-bottom-nav__item mobile-bottom-nav__item--search"
          type="button"
          onClick={onSearch}
          aria-label="Cari produk"
        >
          <span className="mobile-bottom-nav__search-icon"><FiSearch aria-hidden="true" /></span>
          <span>Cari</span>
        </button>

        <NavLink
          className={navItemClassName}
          to="/tersimpan"
          aria-label={savedCount ? `Koleksi, ${savedCount} produk tersimpan` : "Koleksi"}
        >
          <span className="mobile-bottom-nav__icon mobile-bottom-nav__icon--saved">
            <FiBookmark aria-hidden="true" />
            {savedCount ? <span className="mobile-bottom-nav__badge" aria-hidden="true">{badgeLabel}</span> : null}
          </span>
          <span>Koleksi</span>
        </NavLink>

        <button
          className={`mobile-bottom-nav__item${moreOpen || moreRouteActive ? " mobile-bottom-nav__item--active" : ""}`}
          type="button"
          onClick={onMore}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
        >
          <span className="mobile-bottom-nav__icon"><FiMoreHorizontal aria-hidden="true" /></span>
          <span>Lainnya</span>
        </button>
      </div>
    </nav>
  );
};

export default MobileBottomNavigation;
