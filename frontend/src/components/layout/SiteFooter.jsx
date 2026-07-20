import { NavLink } from "react-router-dom";
import BrandLogo from "../common/BrandLogo";
import { SITE } from "../../config/site";

const SiteFooter = () => (
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
);

export default SiteFooter;
