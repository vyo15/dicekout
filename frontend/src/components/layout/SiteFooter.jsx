import { NavLink } from "react-router-dom";
import BrandLogo from "../common/BrandLogo";

const SiteFooter = () => (
  <footer className="site-footer">
    <div className="site-footer__top container">
      <div className="site-footer__brand">
        <BrandLogo compact />
        <p>Rekomendasi produk pilihan yang sudah kami riset. Kamu tetap menentukan pilihanmu sendiri.</p>
      </div>

      <nav className="site-footer__links" aria-label="Informasi DicekOut">
        <NavLink to="/tentang">Tentang</NavLink>
        <NavLink to="/privacy">Privasi</NavLink>
        <NavLink to="/disclosure">Disclosure Affiliate</NavLink>
      </nav>

      <p className="site-footer__disclosure">
        DicekOut dapat memperoleh komisi dari tautan tertentu tanpa biaya tambahan untukmu.
      </p>
    </div>

    <div className="site-footer__bottom container">
      <p>© {new Date().getFullYear()} DicekOut.id</p>
      <p>Harga, stok, dan transaksi mengikuti marketplace tujuan.</p>
    </div>
  </footer>
);

export default SiteFooter;
