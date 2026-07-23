import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiCheck,
  FiCompass,
  FiSearch,
  FiShield,
} from "react-icons/fi";
import Seo from "../components/common/Seo";
import Breadcrumbs from "../components/common/Breadcrumbs";

const principles = [
  {
    icon: FiCompass,
    title: "Dipilih dengan alasan",
    description: "Kami mengutamakan produk yang berguna, relevan, dan layak dipertimbangkan.",
  },
  {
    icon: FiSearch,
    title: "Diriset dengan fokus",
    description: "Informasi penting dirangkum agar kamu tidak perlu membuka terlalu banyak halaman.",
  },
  {
    icon: FiShield,
    title: "Disampaikan dengan jujur",
    description: "Tidak ada rating, stok, diskon, atau klaim berlebihan yang dibuat-buat.",
  },
];

const processSteps = [
  {
    number: "01",
    title: "Kurasi",
    description: "Memilih produk yang sesuai dengan arah katalog DicekOut.",
  },
  {
    number: "02",
    title: "Riset",
    description: "Memeriksa fungsi, detail, konteks penggunaan, dan tujuan tautannya.",
  },
  {
    number: "03",
    title: "Sajikan",
    description: "Menampilkan rekomendasi secara ringkas agar mudah dibandingkan.",
  },
];

const AboutPage = () => (
  <>
    <Seo
      title="Tentang DicekOut | Rekomendasi Produk Terkurasi"
      description="Kenali cara DicekOut memilih, meriset, dan menyajikan rekomendasi produk secara sederhana dan transparan."
      path="tentang"
    />

    <section className="about-hero">
      <div className="container">
        <Breadcrumbs items={[{ label: "Beranda", to: "/" }, { label: "Tentang" }]} />

        <div className="about-hero__layout">
          <div className="about-hero__copy">
            <span className="eyebrow">Tentang DicekOut</span>
            <h1>Rekomendasi yang membantu kamu memilih, bukan memaksa membeli.</h1>
            <p>
              DicekOut menyaring produk yang menarik, merangkum informasi penting, lalu menyajikannya
              dengan cara yang lebih sederhana. Keputusan akhirnya tetap milikmu.
            </p>

            <div className="about-hero__actions">
              <Link className="button button--primary" to="/produk">
                Jelajahi produk <FiArrowRight aria-hidden="true" />
              </Link>
              <a className="about-text-link" href="#cara-kami-memilih">
                Cara kami memilih
              </a>
            </div>
          </div>

          <aside className="about-brand-card" aria-label="Prinsip utama DicekOut">
            <span className="about-brand-card__label">DICEKOUT.ID</span>
            <p>
              Pilih yang kamu mau.
              <strong>DicekOut.id dulu.</strong>
            </p>
            <ul>
              <li><FiCheck aria-hidden="true" /> Produk terpilih</li>
              <li><FiCheck aria-hidden="true" /> Sudah kami riset</li>
              <li><FiCheck aria-hidden="true" /> Tentukan pilihanmu</li>
            </ul>
          </aside>
        </div>
      </div>
    </section>

    <section className="about-section about-section--surface" id="cara-kami-memilih">
      <div className="container about-principles">
        <header className="about-section__heading">
          <span className="eyebrow">Prinsip kami</span>
          <h2>Lebih sedikit kebisingan, lebih banyak informasi yang berguna.</h2>
          <p>
            Kami tidak berusaha menampilkan semuanya. Fokusnya adalah membantu produk yang tepat lebih mudah ditemukan.
          </p>
        </header>

        <div className="about-principles__list">
          {principles.map(({ icon: Icon, title, description }, index) => (
            <article className="about-principle" key={title}>
              <span className="about-principle__number">0{index + 1}</span>
              <Icon aria-hidden="true" />
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="about-section about-section--soft">
      <div className="container">
        <header className="about-section__heading about-section__heading--compact">
          <span className="eyebrow">Cara kami bekerja</span>
          <h2>Dari produk ditemukan sampai siap dilihat.</h2>
        </header>

        <ol className="about-process">
          {processSteps.map((step) => (
            <li key={step.number}>
              <span>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>

    <section className="about-section about-section--surface">
      <div className="container about-transparency">
        <div className="about-transparency__intro">
          <FiShield aria-hidden="true" />
          <span className="eyebrow">Transparansi</span>
          <h2>Jelas sejak awal.</h2>
          <p>DicekOut adalah katalog rekomendasi, bukan marketplace.</p>
        </div>

        <div className="about-transparency__items">
          <article>
            <h3>Tidak ada checkout internal</h3>
            <p>Pembayaran, stok, pengiriman, dan transaksi tetap dilakukan di platform tujuan.</p>
          </article>
          <article>
            <h3>Tautan affiliate diberi konteks</h3>
            <p>DicekOut dapat memperoleh komisi dari tautan tertentu tanpa biaya tambahan untukmu.</p>
          </article>
          <article>
            <h3>Informasi dapat berubah</h3>
            <p>Harga dan ketersediaan final selalu mengikuti informasi terbaru di marketplace.</p>
          </article>
        </div>
      </div>
    </section>

    <section className="about-cta-section">
      <div className="container">
        <div className="about-cta">
          <div>
            <span className="eyebrow">Mulai menjelajah</span>
            <h2>Temukan produk yang memang cocok untukmu.</h2>
          </div>
          <Link className="button button--primary" to="/produk">
            Lihat katalog <FiArrowRight aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  </>
);

export default AboutPage;
