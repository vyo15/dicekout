import { FiDatabase, FiExternalLink, FiMoon, FiShield } from "react-icons/fi";
import Seo from "../components/common/Seo";
import Breadcrumbs from "../components/common/Breadcrumbs";

const PrivacyPage = () => (
  <>
    <Seo
      title="Kebijakan Privasi | DicekOut"
      description="Informasi tentang data yang digunakan oleh versi statis DicekOut dan tautan menuju marketplace eksternal."
      path="privacy"
    />

    <section className="page-hero page-hero--compact">
      <div className="container">
        <Breadcrumbs items={[{ label: "Beranda", to: "/" }, { label: "Kebijakan Privasi" }]} />
        <span className="eyebrow">Privasi</span>
        <h1>Kebijakan privasi DicekOut.</h1>
        <p>Versi awal DicekOut dibuat sebagai website statis tanpa akun pengunjung dan tanpa checkout internal.</p>
      </div>
    </section>

    <section className="section section--surface legal-section">
      <div className="container legal-layout">
        <aside className="legal-summary legal-summary--privacy">
          <FiShield aria-hidden="true" />
          <h2>Prinsip dasar</h2>
          <p>DicekOut hanya menggunakan data yang diperlukan untuk menampilkan katalog dan preferensi tampilan.</p>
        </aside>

        <article className="legal-content">
          <h2>Data yang disimpan di perangkat</h2>
          <div className="legal-icon-row">
            <FiMoon aria-hidden="true" />
            <p>Preferensi tema terang atau gelap disimpan melalui localStorage pada browser pengguna.</p>
          </div>

          <h2>Database dan akun</h2>
          <div className="legal-icon-row">
            <FiDatabase aria-hidden="true" />
            <p>Versi statis ini tidak menyediakan akun pengunjung, database pengguna, komentar, wishlist, atau pembayaran internal.</p>
          </div>

          <h2>Tautan eksternal</h2>
          <div className="legal-icon-row">
            <FiExternalLink aria-hidden="true" />
            <p>
              Saat membuka marketplace atau situs eksternal, kebijakan privasi dan teknologi pelacakan pihak tersebut dapat berlaku.
              DicekOut tidak mengendalikan pengumpulan data di situs eksternal.
            </p>
          </div>

          <h2>Analytics dan tracker</h2>
          <p>
            Source awal DicekOut tidak memasang analytics atau tracker pihak ketiga. Jika nanti fitur tersebut ditambahkan,
            kebijakan ini dan kebutuhan persetujuan pengguna harus ditinjau terlebih dahulu.
          </p>

          <h2>Perubahan kebijakan</h2>
          <p>
            Kebijakan perlu diperbarui apabila DicekOut menambahkan formulir kontak, analytics, backend, login, database,
            atau layanan pihak ketiga yang memproses data pengunjung.
          </p>
        </article>
      </div>
    </section>
  </>
);

export default PrivacyPage;
