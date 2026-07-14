import { NavLink } from "react-router-dom";
import {
  FiBookmark,
  FiChevronRight,
  FiFileText,
  FiInfo,
  FiMoon,
  FiShield,
  FiSun,
  FiTag,
} from "react-icons/fi";
import BottomSheet from "../common/BottomSheet";
import { categories, collections } from "../../utils/catalog";

const MobileMoreMenu = ({ open, onClose, theme, onToggleTheme }) => {
  const primaryCollection = collections[0] || null;

  return (
    <BottomSheet open={open} onClose={onClose} title="Jelajahi DicekOut">
      <div className="mobile-more-menu">
        <section className="mobile-more-menu__section" aria-labelledby="mobile-more-categories">
          <div className="mobile-more-menu__heading">
            <h3 id="mobile-more-categories">Kategori produk</h3>
            <span>{categories.length} kategori</span>
          </div>
          <div className="mobile-more-menu__categories">
            {categories.map((category) => (
              <NavLink
                className="mobile-more-menu__category"
                key={category.id}
                to={`/kategori/${category.slug}`}
                onClick={onClose}
              >
                <span className="mobile-more-menu__category-icon"><FiTag aria-hidden="true" /></span>
                <span>{category.name}</span>
                <FiChevronRight aria-hidden="true" />
              </NavLink>
            ))}
          </div>
        </section>

        <section className="mobile-more-menu__section" aria-labelledby="mobile-more-links">
          <div className="mobile-more-menu__heading">
            <h3 id="mobile-more-links">Menu lainnya</h3>
          </div>
          <div className="mobile-more-menu__links">
            <NavLink to="/tersimpan" onClick={onClose}>
              <span className="mobile-more-menu__link-icon"><FiBookmark aria-hidden="true" /></span>
              <span>
                <strong>Produk Tersimpan</strong>
                <small>Lihat kembali produk yang kamu simpan.</small>
              </span>
              <FiChevronRight aria-hidden="true" />
            </NavLink>

            <NavLink to="/koleksi" onClick={onClose}>
              <span className="mobile-more-menu__link-icon"><FiBookmark aria-hidden="true" /></span>
              <span>
                <strong>Semua Koleksi</strong>
                <small>Jelajahi rekomendasi berdasarkan kebutuhan.</small>
              </span>
              <FiChevronRight aria-hidden="true" />
            </NavLink>

            {primaryCollection ? (
              <NavLink to={`/koleksi/${primaryCollection.slug}`} onClick={onClose}>
                <span className="mobile-more-menu__link-icon"><FiBookmark aria-hidden="true" /></span>
                <span>
                  <strong>Produk dari Konten</strong>
                  <small>Jelajahi rekomendasi dari video terbaru.</small>
                </span>
                <FiChevronRight aria-hidden="true" />
              </NavLink>
            ) : null}

            <NavLink to="/tentang" onClick={onClose}>
              <span className="mobile-more-menu__link-icon"><FiInfo aria-hidden="true" /></span>
              <span>
                <strong>Tentang DicekOut</strong>
                <small>Kenali cara rekomendasi disusun.</small>
              </span>
              <FiChevronRight aria-hidden="true" />
            </NavLink>

            <NavLink to="/disclosure" onClick={onClose}>
              <span className="mobile-more-menu__link-icon"><FiFileText aria-hidden="true" /></span>
              <span>
                <strong>Disclosure Affiliate</strong>
                <small>Informasi transparansi link affiliate.</small>
              </span>
              <FiChevronRight aria-hidden="true" />
            </NavLink>

            <NavLink to="/privacy" onClick={onClose}>
              <span className="mobile-more-menu__link-icon"><FiShield aria-hidden="true" /></span>
              <span>
                <strong>Kebijakan Privasi</strong>
                <small>Informasi penggunaan dan perlindungan data.</small>
              </span>
              <FiChevronRight aria-hidden="true" />
            </NavLink>

            <button type="button" onClick={onToggleTheme}>
              <span className="mobile-more-menu__link-icon">
                {theme === "dark" ? <FiSun aria-hidden="true" /> : <FiMoon aria-hidden="true" />}
              </span>
              <span>
                <strong>{theme === "dark" ? "Gunakan tema terang" : "Gunakan tema gelap"}</strong>
                <small>Tampilan saat ini: {theme === "dark" ? "gelap" : "terang"}.</small>
              </span>
              <FiChevronRight aria-hidden="true" />
            </button>
          </div>
        </section>
      </div>
    </BottomSheet>
  );
};

export default MobileMoreMenu;
