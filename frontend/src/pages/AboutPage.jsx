import { Link } from "react-router-dom";
import { FiCheckCircle, FiCompass, FiHeart, FiShield } from "react-icons/fi";
import Seo from "../components/common/Seo";
import Breadcrumbs from "../components/common/Breadcrumbs";

const AboutPage = () => (
  <>
    <Seo
      title="Tentang DicekOut | Cara Kami Memilih Produk"
      description="Pelajari tujuan DicekOut dan prinsip yang digunakan dalam menyusun rekomendasi produk."
      path="tentang"
    />

    <section className="page-hero page-hero--about">
      <div className="container">
        <Breadcrumbs items={[{ label: "Beranda", to: "/" }, { label: "Tentang" }]} />
        <span className="eyebrow">Tentang DicekOut</span>
        <h1>Pusat rekomendasi produk dari konten yang kamu lihat.</h1>
        <p>
          DicekOut membantu pengunjung menemukan produk dari konten media sosial, memahami konteksnya,
          lalu membuka marketplace melalui tautan yang jelas.
        </p>
      </div>
    </section>

    <section className="section section--surface">
      <div className="container story-grid">
        <article className="story-copy">
          <span className="eyebrow">Tujuan kami</span>
          <h2>Membuat pencarian produk terasa lebih sederhana.</h2>
          <p>
            Link di caption sering tenggelam, sedangkan daftar produk di marketplace dapat berubah.
            DicekOut menjadi halaman rujukan yang rapi untuk produk dari video, postingan, dan koleksi pilihan.
          </p>
          <p>
            Website ini bukan marketplace. DicekOut tidak menyediakan checkout internal, tidak memproses pembayaran,
            dan tidak mengklaim harga atau stok sebagai data realtime.
          </p>
        </article>

        <div className="principle-grid">
          <article><FiCompass aria-hidden="true" /><h3>Mudah ditemukan</h3><p>Produk dapat dicari melalui nama, kategori, dan koleksi konten.</p></article>
          <article><FiHeart aria-hidden="true" /><h3>Personal</h3><p>Setiap produk memiliki alasan rekomendasi, bukan sekadar link.</p></article>
          <article><FiShield aria-hidden="true" /><h3>Transparan</h3><p>Link affiliate dan batasan informasi dijelaskan dengan jelas.</p></article>
          <article><FiCheckCircle aria-hidden="true" /><h3>Tidak berlebihan</h3><p>Tidak ada countdown, stok, rating, atau diskon palsu.</p></article>
        </div>
      </div>
    </section>

    <section className="section section--soft">
      <div className="container editorial-process">
        <div>
          <span className="eyebrow">Sebelum produk ditampilkan</span>
          <h2>Prinsip penyusunan rekomendasi</h2>
        </div>
        <ol>
          <li><span>01</span><div><h3>Pastikan produk yang benar</h3><p>Nama, gambar, deskripsi, dan link harus merujuk pada barang yang sama.</p></div></li>
          <li><span>02</span><div><h3>Tulis konteks yang berguna</h3><p>Jelaskan manfaat, target pengguna, dan hal yang perlu diperhatikan.</p></div></li>
          <li><span>03</span><div><h3>Jaga attribution affiliate</h3><p>Referral code dan parameter link tidak dihapus atau diubah.</p></div></li>
          <li><span>04</span><div><h3>Perbarui saat diperlukan</h3><p>Produk yang tidak tersedia dapat disembunyikan tanpa mengubah slug produk lain.</p></div></li>
        </ol>
        <Link className="button button--primary" to="/produk">Jelajahi katalog</Link>
      </div>
    </section>
  </>
);

export default AboutPage;
