import { Link } from "react-router-dom";
import { FiArrowLeft, FiSearch } from "react-icons/fi";
import Seo from "../components/common/Seo";

const NotFoundPage = () => (
  <>
    <Seo
      title="Halaman Tidak Ditemukan | DicekOut"
      description="Halaman yang Anda cari tidak ditemukan di DicekOut."
      noindex
    />
    <section className="not-found-page">
      <div className="not-found-page__shape" aria-hidden="true" />
      <div className="not-found-page__content container">
        <span>404</span>
        <h1>Produknya belum ditemukan.</h1>
        <p>Link mungkin berubah, produk belum dipublikasikan, atau alamat yang dibuka tidak tepat.</p>
        <div className="not-found-page__actions">
          <Link className="button button--primary" to="/produk"><FiSearch aria-hidden="true" /> Cari produk</Link>
          <Link className="button button--secondary" to="/"><FiArrowLeft aria-hidden="true" /> Kembali ke beranda</Link>
        </div>
      </div>
    </section>
  </>
);

export default NotFoundPage;
